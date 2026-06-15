import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@react-native-vector-icons/ionicons";
import api from "../../services/api";
import { AskEndpoints } from "../../constants/endpoint";
import DialogBox from "../../components/DialogBox";

export default function MentorAskPage() {
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);
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
  const [userId, setUserId] = useState<string>("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"unanswered" | "popular">("unanswered");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  // In-line reply states
  const [replyTextMap, setReplyTextMap] = useState<{ [key: string]: string }>({});
  const [submittingMap, setSubmittingMap] = useState<{ [key: string]: boolean }>({});

  const [askConfig, setAskConfig] = useState<any>({
    maxAnswerChars: null,
  });

  const fetchConfig = async () => {
    try {
      const res = await api.get(AskEndpoints.config);
      if (res.status === 200) {
        setAskConfig(res.data);
      }
    } catch (err) {
      console.error("Error fetching Q&A config:", err);
    }
  };

  useEffect(() => {
    const getUserId = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserId(user.id || user.uid || "");
        }
      } catch (err) {
        console.error("Error loading user info:", err);
      }
    };
    getUserId();
    fetchConfig();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Questions based on Active Tab
  const fetchQuestions = async (pageNum: number, search: string, refresh = false) => {
    if (pageNum === 1) {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
    } else {
      setIsMoreLoading(true);
    }

    try {
      const res = await api.get(AskEndpoints.questions, {
        params: {
          sort: activeTab,
          search: search,
          page: pageNum,
          limit: 10,
        },
      });

      if (res.status === 200) {
        const fetchedQuestions = res.data.questions || [];
        setTotalPages(res.data.pagination?.totalPages || 1);
        if (pageNum === 1) {
          setQuestions(fetchedQuestions);
        } else {
          setQuestions((prev) => [...prev, ...fetchedQuestions]);
        }
      }
    } catch (err) {
      console.error("Error fetching questions for mentor:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsMoreLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchQuestions(1, debouncedSearch);
  }, [activeTab, debouncedSearch]);

  const handleRefresh = () => {
    setPage(1);
    fetchQuestions(1, searchQuery, true);
    fetchConfig();
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isMoreLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchQuestions(nextPage, searchQuery);
    }
  };

  // Submit reply
  const handleSubmitReply = async (questionId: string) => {
    const text = replyTextMap[questionId];
    if (!text || !text.trim()) return;

    if (askConfig.maxAnswerChars && text.length > askConfig.maxAnswerChars) {
      setAlertData({
        title: "Character Limit Exceeded",
        message: `Your answer exceeds the character limit of ${askConfig.maxAnswerChars} characters.`,
      });
      setAlertVisible(true);
      return;
    }

    setSubmittingMap((prev) => ({ ...prev, [questionId]: true }));
    try {
      const res = await api.post(AskEndpoints.postAnswer(questionId), { text });
      if (res.status === 201 || res.status === 200) {
        // Clear input
        setReplyTextMap((prev) => {
          const updated = { ...prev };
          delete updated[questionId];
          return updated;
        });

        // If in unanswered tab, remove this question from list
        if (activeTab === "unanswered") {
          setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        } else {
          // If in popular, refresh to load updated replies list
          handleRefresh();
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to submit answer.";
      setAlertData({ title: "Error", message: msg });
      setAlertVisible(true);
    } finally {
      setSubmittingMap((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleVote = async (answerId: string, voteType: "UP" | "DOWN") => {
    try {
      const res = await api.post(AskEndpoints.voteAnswer(answerId), { voteType });
      if (res.status === 200) {
        const updatedAnswer = res.data;
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

  const renderQuestionItem = ({ item, index }: { item: any; index: number }) => {
    const topAnswer = item.answers && item.answers.length > 0 ? item.answers[0] : null;
    const hasAlreadyAnswered = item.answers?.some((a: any) => a.mentorId === userId);

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
              <Text style={styles.dayText}>{getRelativeDay(item.createdAt)}</Text>
            </View>
            <Text style={styles.questionText}>{item.text}</Text>
          </View>
        </View>

        {/* Answers Container - Reddit Style */}
        {activeTab === "popular" && topAnswer && (
          <View style={styles.answersContainer}>
            <View style={styles.answerCard}>
              <View style={styles.answerHeader}>
                <View style={styles.avatarPlaceholderSmall}>
                  <Ionicons name="school" size={12} color="#2563eb" />
                </View>
                <Text style={styles.mentorName}>
                  {topAnswer.mentor?.name || "Verified Mentor"} (
                  {topAnswer.mentor?.mentorProfile?.iit_name || "IIT"})
                </Text>
              </View>
              <Text style={styles.answerText}>{topAnswer.text}</Text>

              {/* Vote Actions */}
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
            </View>

            {item.answers.length > 1 && (
              <TouchableOpacity
                onPress={() => navigation.navigate("QuestionDetail", { questionId: item.id })}
                style={styles.moreRepliesBtn}
              >
                <Text style={styles.moreRepliesText}>
                  Show {item.answers.length - 1} more answers
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#2563eb" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Answer submission for Mentors */}
        {!hasAlreadyAnswered && (
          <View style={styles.replyForm}>
            <TextInput
              style={styles.replyInput}
              placeholder="Type your answer to this question..."
              placeholderTextColor="#9ca3af"
              value={replyTextMap[item.id] || ""}
              onChangeText={(txt) => setReplyTextMap((prev) => ({ ...prev, [item.id]: txt }))}
              multiline
              onFocus={() => {
                setTimeout(() => {
                  try {
                    flatListRef.current?.scrollToIndex({
                      index,
                      animated: true,
                      viewPosition: 0.3,
                    });
                  } catch (err) {
                    console.log("Failed to scroll to index:", err);
                  }
                }, 150);
              }}
            />
            <Text style={[styles.charCountText, askConfig.maxAnswerChars && (replyTextMap[item.id] || "").length > askConfig.maxAnswerChars ? { color: "#ef4444" } : null]}>
              Characters: {(replyTextMap[item.id] || "").length}
              {askConfig.maxAnswerChars ? ` / ${askConfig.maxAnswerChars}` : ""}
            </Text>
            <TouchableOpacity
              style={[
                styles.replySubmitBtn,
                !(replyTextMap[item.id] || "").trim() ? styles.replySubmitBtnDisabled : null,
              ]}
              onPress={() => handleSubmitReply(item.id)}
              disabled={submittingMap[item.id] || !(replyTextMap[item.id] || "").trim()}
            >
              {submittingMap[item.id] ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.replySubmitBtnText}>Submit Answer</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {hasAlreadyAnswered && activeTab === "unanswered" && (
          <View style={styles.answeredBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.answeredBadgeText}>You have answered this question</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : (isKeyboardVisible ? 'height' : undefined)}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'android' ? 70 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mentor Inbox</Text>
        </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("unanswered")}
          style={[styles.tabButton, activeTab === "unanswered" ? styles.tabButtonActive : null]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "unanswered" ? styles.tabButtonTextActive : null,
            ]}
          >
            Unanswered
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("popular")}
          style={[styles.tabButton, activeTab === "popular" ? styles.tabButtonActive : null]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "popular" ? styles.tabButtonTextActive : null,
            ]}
          >
            Popular
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Container */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Q&A..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={questions}
            renderItem={({ item, index }) => renderQuestionItem({ item, index })}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={["#2563eb"]}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isMoreLoading ? (
                <ActivityIndicator size="small" color="#2563eb" style={{ marginVertical: 16 }} />
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbox-ellipses-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No questions found.</Text>
              </View>
            }
          />
        </View>
      )}
      <DialogBox
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertVisible(false)}
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
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
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    marginHorizontal: "5%",
    marginTop: 12,
    borderRadius: 8,
    padding: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: "white",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
  },
  tabButtonTextActive: {
    color: "#1f2937",
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
  dayText: {
    fontSize: 11,
    color: "#6b7280",
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
    color: "#2563eb",
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
    color: "#2563eb",
    fontWeight: "600",
    marginRight: 4,
  },
  replyForm: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },
  replyInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    color: "#1f2937",
    textAlignVertical: "top",
    minHeight: 60,
    marginBottom: 8,
  },
  replySubmitBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: "center",
  },
  replySubmitBtnDisabled: {
    backgroundColor: "#9ca3af",
  },
  replySubmitBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
  },
  answeredBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#ecfdf5",
    padding: 8,
    borderRadius: 6,
  },
  answeredBadgeText: {
    fontSize: 12,
    color: "#065f46",
    fontWeight: "600",
    marginLeft: 6,
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
  charCountText: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 6,
    textAlign: "right",
  },
});
