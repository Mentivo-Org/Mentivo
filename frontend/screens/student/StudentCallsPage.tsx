import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useNavigation, useScrollToTop } from "@react-navigation/native";
import api from "../../services/api";
import { MentorEndpoints, CallEndpoints } from "../../constants/endpoint";

import { useTabPressRefresh } from "../../hooks/useTabPressRefresh";

const { width } = Dimensions.get("window");

export default function StudentCallsPage() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [isLoadingRecentCalls, setIsLoadingRecentCalls] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  useScrollToTop(scrollViewRef);

  const fetchFavorites = async () => {
    setIsLoadingFavorites(true);
    try {
      const response = await api.get(MentorEndpoints.getFavoriteMentors);
      if (response.status === 200) {
        const fetchedFavs = response.data.map((m: any) => ({
          id: m.mentorId,
          name: m.user?.name || "Unknown",
          iit: m.iit_name || "IIT",
        }));
        setFavorites(fetchedFavs);
      }
    } catch (error) {
      console.error("Failed to fetch favorite mentors:", error);
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  const fetchRecentCalls = async () => {
    setIsLoadingRecentCalls(true);
    try {
      const response = await api.get(CallEndpoints.getStudentSessions);
      if (response.status === 200) {
        const fetchedRecentCalls = response.data.slice(0, 10).map((s: any) => ({
          id: s.id,
          name: s.mentor?.name || "Unknown Mentor",
          iit: s.mentor?.mentorProfile?.iit_name || "Unknown IIT",
          day: new Date(s.createdAt).toLocaleDateString("en-US", { weekday: "long" }),
        }));
        setRecentCalls(fetchedRecentCalls);
      }
    } catch (error) {
      console.error("Failed to fetch recent calls:", error);
    } finally {
      setIsLoadingRecentCalls(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchFavorites(), fetchRecentCalls()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchFavorites();
    fetchRecentCalls();
  }, []);

  useTabPressRefresh(navigation, handleRefresh);

  const renderFavourite = ({ item }: { item: any }) => (
    <View style={styles.favouriteItem}>
      <View style={styles.avatarPlaceholder} />
      <View style={styles.favouriteInfo}>
        <Text style={styles.favouriteName}>{item.name}</Text>
        <Text style={styles.favouriteIit}>{item.iit}</Text>
      </View>
    </View>
  );

  const renderRecentCall = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.recentItem}>
      <View style={styles.recentContent}>
        <View style={styles.avatarPlaceholderLarge} />
        <View style={styles.recentInfoContainer}>
          <View style={styles.recentMainInfo}>
            <View>
              <Text style={styles.recentName}>{item.name}</Text>
              <Text style={styles.recentIit}>{item.iit}</Text>
            </View>
            <View style={styles.recentRightInfo}>
              <Text style={styles.recentDay}>{item.day}</Text>
              {item.unread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calls</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Image source={require("../../app-assets/search-icon.svg")} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Explore mentor by IIT name"
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
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#0077CB"]} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favourites</Text>
          {favorites.length > 0 ? (
            <FlatList
              data={favorites}
              renderItem={renderFavourite}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favouriteList}
            />
          ) : (
            <View style={styles.emptyContainerSmall}>
              {isLoadingFavorites ? (
                <ActivityIndicator size="small" color="#0077CB" />
              ) : (
                <Text style={styles.emptyTextSmall}>No favourite mentors yet.</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent</Text>
          {isLoadingRecentCalls ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="small" color="#0077CB" />
            </View>
          ) : recentCalls.length > 0 ? (
            recentCalls.map((item) => (
              <React.Fragment key={item.id}>
                {renderRecentCall({ item })}
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recent calls.</Text>
            </View>
          )}
        </View>
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
    width: 255,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 39,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
  searchIcon: {
    width: 11,
    height: 11,
    marginRight: 16,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "normal",
    color: "black",
    marginBottom: 16,
  },
  favouriteList: {
    paddingRight: 16,
  },
  favouriteItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: "#c0c0c0",
    borderRadius: 8,
  },
  favouriteInfo: {
    marginLeft: 16,
    width: 125,
  },
  favouriteName: {
    fontSize: 16,
    color: "black",
  },
  favouriteIit: {
    fontSize: 12,
    color: "#444653",
    marginTop: 4,
  },
  recentItem: {
    marginBottom: 8,
  },
  recentContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarPlaceholderLarge: {
    width: 56,
    height: 56,
    backgroundColor: "#c0c0c0",
    borderRadius: 8,
  },
  recentInfoContainer: {
    flex: 1,
    marginLeft: 16,
    height: 56,
    justifyContent: "center",
  },
  recentMainInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 270,
  },
  recentName: {
    fontSize: 16,
    color: "black",
  },
  recentIit: {
    fontSize: 12,
    color: "#444653",
    marginTop: 4,
  },
  recentRightInfo: {
    alignItems: "flex-end",
  },
  recentDay: {
    fontSize: 12,
    color: "#0077CB",
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: "#0077CB",
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    color: "white",
    fontSize: 8,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#444653',
  },
  emptyContainerSmall: {
    padding: 10,
  },
  emptyTextSmall: {
    fontSize: 12,
    color: '#444653',
    fontStyle: 'italic',
  }
});
