import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@react-native-vector-icons/ionicons";
import api from "../../services/api";
import { AskEndpoints, CallEndpoints, WalletEndpoints } from "../../constants/endpoint";
import DialogBox from "../../components/DialogBox";
import { useLoading } from "../../context/LoadingContext";
import useSWR, { mutate } from "swr";
import { Skeleton } from "../../components/Skeleton";

const { width } = Dimensions.get("window");
const fetcher = (url: string) => api.get(url).then(res => res.data);
const fetcherWithParams = ([url, params]: [string, any]) => api.get(url, { params }).then(res => res.data);

export default function StudentAskPage() {
  const navigation = useNavigation<any>();
  const { showLoading, hideLoading } = useLoading();
  const [userId, setUserId] = useState<string>("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    secondaryButtonText?: string;
    onSecondaryPress?: () => void;
    onPrimaryPress?: () => void;
  }>({ title: '', message: '' });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  // Post Question Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Fetch Ask Configuration via SWR
  const { data: configData } = useSWR(AskEndpoints.config, fetcher);
  const askConfig = configData || {
    maxQuestionChars: null,
    maxQuestionsPerPeriod: 5,
    periodHours: 24,
  };

  // Fetch logged-in user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserId(user.id || user.uid || "");
        }
      } catch (err) {
        console.error("Error reading user from storage:", err);
      }
    };
    getUserId();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Questions via SWR
  const { data: fetchResult, error: questionsError, isLoading } = useSWR(
    [AskEndpoints.questions, { sort: "popular", search: debouncedSearch, page, limit: 10 }],
    fetcherWithParams
  );

  useEffect(() => {
    if (fetchResult) {
      const fetchedQuestions = fetchResult.questions || [];
      setTotalPages(fetchResult.pagination?.totalPages || 1);
      if (page === 1) {
        setQuestions(fetchedQuestions);
      } else {
        setQuestions((prev) => {
          const existingIds = new Set(prev.map(q => q.id));
          const newQuestions = fetchedQuestions.filter((q: any) => !existingIds.has(q.id));
          return [...prev, ...newQuestions];
        });
      }
      setIsMoreLoading(false);
    }
  }, [fetchResult, page]);

  const handleInitiateCall = async (mentor: any) => {
    if (!mentor) return;
    showLoading("Initiating call...");
    try {
      const balanceResponse = await api.get(WalletEndpoints.getBalance);
      const balance = balanceResponse.data?.balance ?? 0;
      
      if (balance < 10) {
        hideLoading();
        setAlertData({
          title: "Insufficient Balance",
          message: "Please add money to your wallet to start the call.",
          secondaryButtonText: "Add Funds",
          onSecondaryPress: () => {
            navigation.navigate("Payment");
          }
        });
        setAlertVisible(true);
        return;
      }

      const response = await api.post(CallEndpoints.initiate, { mentorId: mentor.id || mentor.mentorId });
      if (response.status === 200) {
        const { sessionId, channelName, studentToken, maxDurationSeconds, mentorPhoto, chatSessionId } = response.data;
        
        navigation.navigate('InCall', {
          callId: sessionId,
          channelName,
          callerName: mentor.name || mentor.mentor?.name || "Mentor",
          role: 'caller',
          initialToken: studentToken,
          maxDuration: maxDurationSeconds,
          mentorPhoto: mentorPhoto || mentor.photoUrl || mentor.mentor?.photoUrl,
          chatSessionId
        });
      }
    } catch (error: any) {
      console.error('Failed to initiate call:', error);
      const errorMsg = error.response?.data?.error || 'Failed to connect. Please try again.';
      const isInsufficient = errorMsg.toLowerCase().includes("insufficient");
      setAlertData({ 
        title: 'Call Error', 
        message: errorMsg,
        secondaryButtonText: isInsufficient ? "Add Funds" : undefined,
        onSecondaryPress: isInsufficient ? () => navigation.navigate("Payment") : undefined
      });
      setAlertVisible(true);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(1);
    await Promise.all([
      mutate(AskEndpoints.config),
      mutate([AskEndpoints.questions, { sort: "popular", search: searchQuery, page: 1, limit: 10 }])
    ]);
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isMoreLoading && !isLoading) {
      setIsMoreLoading(true);
      setPage(prev => prev + 1);
    }
  };


  // Handle post question
  const handlePostQuestion = async () => {
    if (!questionText.trim()) return;

    if (askConfig.maxQuestionChars && questionText.length > askConfig.maxQuestionChars) {
      setAlertData({ title: "Character Limit Exceeded", message: `Question exceeds character limit of ${askConfig.maxQuestionChars} characters.` });
      setAlertVisible(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post(AskEndpoints.questions, { text: questionText });
      if (res.status === 201) {
        setQuestionText("");
        setIsModalVisible(false);
        // Refresh to see the new question
        handleRefresh();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to post question. Please try again.";
      setAlertData({ title: "Error", message: msg });
      setAlertVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle soft deletion
  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const res = await api.delete(AskEndpoints.questionById(questionId));
      if (res.status === 200) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      }
    } catch (err) {
      console.error("Failed to delete question:", err);
      setAlertData({ title: "Error", message: "Failed to delete question." });
      setAlertVisible(true);
    }
  };

  // Upvote/Downvote handling
  const handleVote = async (answerId: string, voteType: "UP" | "DOWN") => {
    try {
      const res = await api.post(AskEndpoints.voteAnswer(answerId), { voteType });
      if (res.status === 200) {
        const updatedAnswer = res.data;
        // Update the list of questions locally
        setQuestions((prev) =>
          prev.map((q) => {
            const updatedAnswers = q.answers.map((a: any) =>
              a.id === answerId ? { ...a, upvotes: updatedAnswer.upvotes, downvotes: updatedAnswer.downvotes } : a
            );
            return { ...q, answers: updatedAnswers };
          })
        );
      }
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  const getRelativeDay = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const renderQuestionItem = ({ item }: { item: any }) => {
    const isOwner = item.studentId === userId;
    // Reddit style: Show top answer first (if it exists)
    const hasAnswers = item.answers && item.answers.length > 0;
    const topAnswer = hasAnswers ? item.answers[0] : null;

    return (
      <View style={styles.questionCard}>
        {/* Question Header */}
        <View style={styles.questionHeader}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={16} color="#444653" />
          </View>
          <View style={styles.questionMainContent}>
            <View style={styles.questionUserRow}>
              <Text style={styles.userName}>{item.student?.name || "Student"}</Text>
              <View style={styles.headerRight}>
                <Text style={styles.dayText}>{getRelativeDay(item.createdAt)}</Text>
                {isOwner && (
                  <TouchableOpacity
                    onPress={() => handleDeleteQuestion(item.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text style={styles.questionText}>{item.text}</Text>
          </View>
        </View>

        {/* Answers Container - Reddit Style */}
        {topAnswer ? (
          <View style={styles.answersContainer}>
            <View style={styles.answerCard}>
              <View style={styles.answerHeader}>
                <View style={styles.avatarPlaceholderSmall}>
                  <Ionicons name="school" size={12} color="#0077CB" />
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate("MentorProfile", { mentorId: topAnswer.mentor?.id || topAnswer.mentorId })}
                >
                  <Text style={styles.mentorName}>
                    {topAnswer.mentor?.name || "Verified Mentor"} (
                    {topAnswer.mentor?.mentorProfile?.iit_name || "IIT"})
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.answerText}>{topAnswer.text}</Text>

              {/* Vote & Call Row */}
              <View style={styles.voteAndCallRow}>
                <View style={styles.voteContainer}>
                  <TouchableOpacity
                    onPress={() => handleVote(topAnswer.id, "UP")}
                    style={styles.voteButton}
                  >
                    <Ionicons name="arrow-up-circle-outline" size={20} color="#6b7280" />
                    <Text style={styles.voteCount}>{topAnswer.upvotes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleVote(topAnswer.id, "DOWN")}
                    style={styles.voteButton}
                  >
                    <Ionicons name="arrow-down-circle-outline" size={20} color="#6b7280" />
                    <Text style={styles.voteCount}>{topAnswer.downvotes}</Text>
                  </TouchableOpacity>
                </View>
                {topAnswer.mentor && (
                  <TouchableOpacity
                    onPress={() => handleInitiateCall(topAnswer.mentor)}
                    style={styles.talkButton}
                  >
                    <Text style={styles.talkButtonText}>Talk to {topAnswer.mentor.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {item.answers.length > 1 && (
              <TouchableOpacity
                onPress={() => navigation.navigate("QuestionDetail", { questionId: item.id })}
                style={styles.moreRepliesBtn}
              >
                <Text style={styles.moreRepliesText}>
                  Show {item.answers.length - 1} more answers
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#0077CB" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.noAnswersContainer}>
            <Text style={styles.noAnswersText}>No answers yet.</Text>
          </View>
        )}
      </View>
    );
  };

  const charCount = questionText.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ask Portal</Text>
        <TouchableOpacity style={styles.askButton} onPress={() => setIsModalVisible(true)}>
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.askButtonText}>Ask</Text>
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search questions..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      {isLoading && page === 1 ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map((key) => (
            <View key={key} style={[styles.questionCard, { borderColor: '#e5e7eb', padding: 16, marginBottom: 16 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Skeleton style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Skeleton style={{ width: 120, height: 16, borderRadius: 8, marginBottom: 6 }} />
                  <Skeleton style={{ width: 80, height: 12, borderRadius: 6 }} />
                </View>
              </View>
              <Skeleton style={{ width: '100%', height: 40, borderRadius: 8, marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton style={{ width: 60, height: 20, borderRadius: 10 }} />
                <Skeleton style={{ width: 80, height: 20, borderRadius: 10 }} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={questions}
          renderItem={renderQuestionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#0077CB"]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isMoreLoading ? (
              <ActivityIndicator size="small" color="#0077CB" style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No questions found.</Text>
            </View>
          }
        />
      )}

      {/* Post Question Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : (isKeyboardVisible ? "padding" : undefined)}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ask a Question</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="What is your question? (e.g. Tips for JEE Physics...)"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={6}
              value={questionText}
              onChangeText={setQuestionText}
            />

            {/* Character count limits */}
            <View style={styles.limitInfo}>
              <Text style={[styles.charCountText, askConfig.maxQuestionChars && charCount > askConfig.maxQuestionChars ? { color: "#ef4444" } : null]}>
                Characters: {charCount}
                {askConfig.maxQuestionChars ? ` / ${askConfig.maxQuestionChars}` : ""}
              </Text>
              <Text style={styles.rateLimitText}>
                Limit: {askConfig.maxQuestionsPerPeriod} questions / {askConfig.periodHours}h
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting || !questionText.trim() ? styles.submitButtonDisabled : null]}
              onPress={handlePostQuestion}
              disabled={isSubmitting || !questionText.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Question</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <DialogBox
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        secondaryButtonText={alertData.secondaryButtonText}
        onSecondaryPress={() => {
          setAlertVisible(false);
          alertData.onSecondaryPress?.();
        }}
        onPrimaryPress={() => {
          setAlertVisible(false);
          alertData.onPrimaryPress?.();
        }}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: "5%",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "white",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  askButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0077CB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  askButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  searchSection: {
    paddingHorizontal: "5%",
    marginVertical: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1f2937",
  },
  listContent: {
    paddingHorizontal: "5%",
    paddingBottom: 40,
  },
  questionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  questionHeader: {
    flexDirection: "row",
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarPlaceholderSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  questionMainContent: {
    flex: 1,
  },
  questionUserRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontWeight: "bold",
    color: "#374151",
    fontSize: 14,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  dayText: {
    fontSize: 11,
    color: "#6b7280",
  },
  deleteButton: {
    marginLeft: 8,
  },
  questionText: {
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 20,
  },
  answersContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },
  answerCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  mentorName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0077CB",
  },
  answerText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  voteContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  voteCount: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
    fontWeight: "500",
  },
  moreRepliesBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 6,
  },
  moreRepliesText: {
    fontSize: 12,
    color: "#0077CB",
    fontWeight: "600",
    marginRight: 4,
  },
  noAnswersContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },
  noAnswersText: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#1f2937",
    textAlignVertical: "top",
    marginBottom: 12,
    height: 120,
  },
  limitInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  charCountText: {
    fontSize: 12,
    color: "#6b7280",
  },
  rateLimitText: {
    fontSize: 12,
    color: "#6b7280",
  },
  submitButton: {
    backgroundColor: "#0077CB",
    borderRadius: 24,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
  voteAndCallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  talkButton: {
    backgroundColor: "#0077CB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  talkButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
