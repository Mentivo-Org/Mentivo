import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useNavigation, useScrollToTop } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function MentorAskPage() {
  const navigation = useNavigation<any>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollToTop(scrollViewRef);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e: any) => {
      if (navigation.isFocused()) {
        handleRefresh();
      }
    });
    return unsubscribe;
  }, [navigation]);

  const questions = [
    {
      id: "1",
      user: "Hera",
      text: "What is he best way to solve calculus problem.",
      time: "3h",
      hearts: "012",
      hasAnswered: false,
    },
    {
      id: "2",
      user: "Anonymous",
      text: "What is he best way to solve calculus problem.",
      time: "4m",
      hearts: "012",
      hasAnswered: false,
    },
    {
      id: "3",
      user: "Bobby",
      text: "What is he best way to solve calculus problem.",
      time: "5d",
      hearts: "012",
      hasAnswered: true,
      answer: "The solution could be found by practicing regularly...",
    },
  ];

  const handleAnswerSubmit = (id: string) => {
    // In a real app, send answerText to backend
    setAnsweringId(null);
    setAnswerText("");
  };

  const renderQuestion = (question: any) => (
    <View key={question.id} style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.avatarPlaceholder} />
        <View style={styles.questionMainContent}>
          <View style={styles.questionUserRow}>
            <Text style={styles.userName}>{question.user}</Text>
            <Text style={styles.timeText}>{question.time}</Text>
          </View>
          <Text style={styles.questionText}>{question.text}</Text>
        </View>
      </View>
      
      <View style={styles.questionFooter}>
        <TouchableOpacity 
          onPress={() => setAnsweringId(question.id)}
          disabled={question.hasAnswered}
        >
          <Text style={[styles.answerActionText, question.hasAnswered && {color: '#9ca3af'}]}>
            {question.hasAnswered ? "Answered" : "Answer"}
          </Text>
        </TouchableOpacity>

        <View style={styles.heartsContainer}>
          <Image source={require("../../app-assets/heart-icon.svg")} style={styles.heartIcon} tintColor="#444653" />
          <Text style={styles.heartsCount}>{question.hearts}</Text>
        </View>
      </View>

      {/* Answer Input Area */}
      {answeringId === question.id && !question.hasAnswered && (
        <View style={styles.answerInputContainer}>
          <TextInput
            style={styles.answerInput}
            placeholder="Type your answer here..."
            placeholderTextColor="#9ca3af"
            multiline
            value={answerText}
            onChangeText={setAnswerText}
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={() => handleAnswerSubmit(question.id)}
          >
            <Image source={require("../../app-assets/arrow-right-white.svg")} style={styles.sendIcon} tintColor="#2563eb" />
          </TouchableOpacity>
        </View>
      )}

      {/* Display Existing Answer */}
      {question.hasAnswered && question.answer && (
        <View style={styles.existingAnswerContainer}>
          <Text style={styles.existingAnswerText}>{question.answer}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Inbox</Text>
          <Text style={styles.headerSubtitle}>{questions.length} Questions</Text>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#2563eb"]} />
          }
        >
          {questions.length > 0 ? (
            questions.map(renderQuestion)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No questions in your inbox yet.</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    color: "black",
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#444653",
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for tab bar
  },
  questionCard: {
    marginBottom: 24,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: "row",
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    backgroundColor: "#c0c0c0",
    borderRadius: 16,
    marginRight: 12,
  },
  questionMainContent: {
    flex: 1,
  },
  questionUserRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
  },
  timeText: {
    fontSize: 12,
    color: "#2563eb",
  },
  questionText: {
    fontSize: 14,
    color: "#444653",
    lineHeight: 20,
  },
  questionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingLeft: 44, // Align with text
  },
  answerActionText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2563eb",
  },
  heartsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  heartIcon: {
    width: 15,
    height: 15,
    marginRight: 6,
  },
  heartsCount: {
    fontSize: 12,
    color: "#444653",
    fontWeight: "500",
  },
  answerInputContainer: {
    marginTop: 16,
    marginLeft: 44,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  answerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 14,
    color: "black",
  },
  sendButton: {
    padding: 8,
    marginLeft: 8,
  },
  sendIcon: {
    width: 20,
    height: 20,
  },
  existingAnswerContainer: {
    marginTop: 16,
    marginLeft: 44,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  existingAnswerText: {
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#444653',
    textAlign: 'center',
  },
});
