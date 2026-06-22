import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "@react-native-vector-icons/ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import { AskEndpoints, CallEndpoints, WalletEndpoints } from "../../constants/endpoint";
import DialogBox from "../../components/DialogBox";
import { useLoading } from "../../context/LoadingContext";

export default function QuestionDetailScreen() {
  const navigation = useNavigation<any>();
  const { showLoading, hideLoading } = useLoading();
  const route = useRoute<any>();
  const { questionId } = route.params;

  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [question, setQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    secondaryButtonText?: string;
    onSecondaryPress?: () => void;
    onPrimaryPress?: () => void;
  }>({ title: '', message: '' });

  // Mentor answering states
  const [answerText, setAnswerText] = useState("");
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

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserId(user.id || user.uid || "");
          setUserRole(user.role || "");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };
    getUserInfo();
    fetchQuestionDetail();
  }, [questionId]);

  const fetchQuestionDetail = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(AskEndpoints.questionById(questionId));
      if (res.status === 200) {
        setQuestion(res.data);
      }
    } catch (err) {
      console.error("Error fetching question details:", err);
      setAlertData({ title: "Error", message: "Failed to load question details." });
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (answerId: string, voteType: "UP" | "DOWN") => {
    try {
      const res = await api.post(AskEndpoints.voteAnswer(answerId), { voteType });
      if (res.status === 200) {
        const updatedAnswer = res.data;
        setQuestion((prev: any) => {
          if (!prev) return prev;
          const updatedAnswers = prev.answers.map((a: any) =>
            a.id === answerId ? { ...a, upvotes: updatedAnswer.upvotes, downvotes: updatedAnswer.downvotes } : a
          );
          // Re-sort answers by upvotes
          updatedAnswers.sort((a: any, b: any) => b.upvotes - a.upvotes);
          return { ...prev, answers: updatedAnswers };
        });
      }
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  const handlePostAnswer = async () => {
    if (!answerText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(AskEndpoints.postAnswer(questionId), { text: answerText });
      if (res.status === 201 || res.status === 200) {
        setAnswerText("");
        // Refresh detail
        fetchQuestionDetail();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to post answer.";
      setAlertData({ title: "Error", message: msg });
      setAlertVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const getRelativeDay = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    return `${diffDays} days ago`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0077CB" />
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Question not found or deleted.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if this mentor already answered the question
  const hasMentorAnswered =
    userRole === "mentor" && question.answers.some((a: any) => a.mentorId === userId);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : (isKeyboardVisible ? 'height' : undefined)}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'android' ? 70 : 0}
      >
        {/* Top Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Question Thread</Text>
        <View style={{ width: 24 }} />
      </View>

        {/* Question Header Card */}
        <View style={styles.questionCard}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={18} color="#444653" />
          </View>
          <View style={styles.questionContent}>
            <View style={styles.questionUserRow}>
              <Text style={styles.userName}>{question.student?.name || "Student"}</Text>
              <Text style={styles.dayText}>{getRelativeDay(question.createdAt)}</Text>
            </View>
            <Text style={styles.questionText}>{question.text}</Text>
          </View>
        </View>

        {/* Answers List */}
        <View style={styles.answersSection}>
          <Text style={styles.answersSectionTitle}>
            Answers ({question.answers?.length || 0})
          </Text>

          <FlatList
            data={question.answers || []}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.answersList}
            renderItem={({ item }) => (
              <View style={styles.answerCard}>
                <View style={styles.answerHeader}>
                  <View style={styles.avatarPlaceholderSmall}>
                    <Ionicons name="school" size={12} color="#0077CB" />
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("MentorProfile", { mentorId: item.mentor?.id || item.mentorId })}
                  >
                    <Text style={styles.mentorName}>
                      {item.mentor?.name || "Verified Mentor"} (
                      {item.mentor?.mentorProfile?.iit_name || "IIT"})
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.dayTextSmall}>{getRelativeDay(item.createdAt)}</Text>
                </View>

                <Text style={styles.answerText}>{item.text}</Text>

                {/* Vote & Call Row */}
                <View style={styles.voteAndCallRow}>
                  <View style={styles.voteContainer}>
                    <TouchableOpacity
                      onPress={() => handleVote(item.id, "UP")}
                      style={styles.voteButton}
                    >
                      <Ionicons name="arrow-up-circle-outline" size={20} color="#6b7280" />
                      <Text style={styles.voteCount}>{item.upvotes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleVote(item.id, "DOWN")}
                      style={styles.voteButton}
                    >
                      <Ionicons name="arrow-down-circle-outline" size={20} color="#6b7280" />
                      <Text style={styles.voteCount}>{item.downvotes}</Text>
                    </TouchableOpacity>
                  </View>
                  {userRole !== 'mentor' && item.mentor && (
                    <TouchableOpacity
                      onPress={() => handleInitiateCall(item.mentor)}
                      style={styles.talkButton}
                    >
                      <Text style={styles.talkButtonText}>Talk to {item.mentor.name.split(' ')[0]}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyAnswers}>
                <Ionicons name="chatbubble-outline" size={32} color="#9ca3af" />
                <Text style={styles.emptyAnswersText}>Be the first to answer this question!</Text>
              </View>
            }
          />
        </View>

        {/* Answer Input Box (Mentor side only, one answer only) */}
        {userRole === "mentor" && !hasMentorAnswered && (
          <View style={styles.answerInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Write your answer..."
              placeholderTextColor="#9ca3af"
              value={answerText}
              onChangeText={setAnswerText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !answerText.trim() ? styles.sendButtonDisabled : null]}
              onPress={handlePostAnswer}
              disabled={isSubmitting || !answerText.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={16} color="white" />
              )}
            </TouchableOpacity>
          </View>
        )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: "5%",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "white",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    marginBottom: 16,
    textAlign: "center",
  },
  backBtn: {
    backgroundColor: "#0077CB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: "white",
    fontWeight: "bold",
  },
  questionCard: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  questionContent: {
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
    fontSize: 15,
    color: "#1f2937",
    lineHeight: 22,
  },
  answersSection: {
    flex: 1,
    padding: 16,
  },
  answersSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 12,
  },
  answersList: {
    paddingBottom: 24,
  },
  answerCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  mentorName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0077CB",
  },
  dayTextSmall: {
    fontSize: 10,
    color: "#9ca3af",
    marginLeft: "auto",
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
  },
  emptyAnswers: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyAnswersText: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 8,
  },
  answerInputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1f2937",
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0077CB",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#9ca3af",
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
