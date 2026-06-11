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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useNavigation, useScrollToTop } from "@react-navigation/native";

import { useTabPressRefresh } from "../../hooks/useTabPressRefresh";

const { width } = Dimensions.get("window");

export default function StudentAskPage() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  useScrollToTop(scrollViewRef);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate fetching data
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  useTabPressRefresh(navigation, handleRefresh);

  const questions = [
    {
      id: "1",
      user: "You",
      text: "What is he best way to solve calculus problem.",
      day: "Friday",
      replies: 8,
      hearts: "012",
    },
    {
      id: "2",
      user: "You",
      text: "What is he best way to solve calculus problem.",
      day: "Friday",
      replies: 8,
      hearts: "012",
    },
    {
      id: "3",
      user: "You",
      text: "What is he best way to solve calculus problem.",
      day: "Friday",
      replies: 8,
      hearts: "012",
    },
  ];

  const renderQuestion = (question: any) => (
    <View key={question.id} style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.avatarPlaceholder} />
        <View style={styles.questionMainContent}>
          <View style={styles.questionUserRow}>
            <Text style={styles.userName}>{question.user}</Text>
            <Text style={styles.dayText}>{question.day}</Text>
          </View>
          <Text style={styles.questionText}>{question.text}</Text>
        </View>
      </View>
      
      <View style={styles.questionFooter}>
        <View style={styles.repliesContainer}>
          <Text style={styles.repliesCount}>{question.replies}</Text>
          <Text style={styles.repliesText}>Replies</Text>
        </View>
        <View style={styles.heartsContainer}>
          <Image source={require("../../app-assets/heart-icon.svg")} style={styles.heartIcon} tintColor="#444653" />
          <Text style={styles.heartsCount}>{question.hearts}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ask</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <View style={styles.plusIconBadge}>
             <Image source={require("../../app-assets/x-icon.svg")} style={styles.plusIcon} tintColor="white" />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Ask questions"
            placeholderTextColor="#444653"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
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
            <Text style={styles.emptyText}>No questions asked yet.</Text>
          </View>
        )}
      </ScrollView>
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
  },
  headerTitle: {
    fontSize: 16,
    color: "#444653",
    fontWeight: "normal",
  },
  searchSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    width: 238,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 39,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
    height: 33,
    justifyContent: "center",
  },
  plusIconBadge: {
    backgroundColor: "#2563eb",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
    transform: [{ rotate: '45deg' }] // To make x-icon look like a plus if needed, but wait I should check if there is a plus icon
  },
  plusIcon: {
    width: 16,
    height: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#444653",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for tab bar
  },
  questionCard: {
    marginBottom: 24,
  },
  questionHeader: {
    flexDirection: "row",
    width: 342,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    backgroundColor: "#c0c0c0",
    borderRadius: 16,
    marginRight: 16,
    marginTop: 0,
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
    fontWeight: "normal",
    color: "black",
  },
  dayText: {
    fontSize: 12,
    color: "#2563eb",
  },
  questionText: {
    fontSize: 12,
    color: "#444653",
    lineHeight: 12,
    width: 216,
  },
  questionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingLeft: 48, // Aligned with text
    width: 358,
  },
  repliesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  repliesCount: {
    fontSize: 12,
    color: "black",
    marginRight: 4,
  },
  repliesText: {
    fontSize: 12,
    color: "black",
  },
  heartsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  heartIcon: {
    width: 15,
    height: 15,
    marginRight: 4,
  },
  heartsCount: {
    fontSize: 12,
    color: "#444653",
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
