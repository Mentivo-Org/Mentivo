import React, { useEffect, useState, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import MentorCard from "../../components/MentorCard";
import api from "../../services/api";
import { MentorEndpoints } from "../../constants/endpoint";

const { width } = Dimensions.get("window");

export default function FavoriteMentorsPage() {
  const navigation = useNavigation<any>();
  const [mentors, setMentors] = useState<any[]>([]);
  const [displayedMentors, setDisplayedMentors] = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const syncFavoritesList = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(MentorEndpoints.getFavoriteMentors);
      if (response.status === 200 && Array.isArray(response.data)) {
        const formatted = response.data.map((fav: any) => ({
          id: fav.mentorId,
          name: fav.user?.name || "Unknown Mentor",
          iit: fav.iit_name || fav.iit || "IIT Graduate",
          branch: fav.branch || "",
          year: fav.year ? `Y${fav.year}` : "",
          price: fav.price || 10,
          photoUrl: fav.user?.photo_url || fav.photo_url || null,
          isOnline: fav.isOnline || false,
          rating: fav.avg_rating || 0,
          calls: fav.total_calls || 0,
          mentorlevel: fav.mentorlevel,
        }));
        
        setMentors(formatted);
        const ids = formatted.map(m => m.id);
        setFavoriteIds(ids);
        await AsyncStorage.setItem("favouriteMentors", JSON.stringify(ids));
      }
    } catch (error) {
      console.error("Failed to fetch favorite mentors:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleToggleFavorite = async (mentorId: string) => {
    // Optimistically remove from list
    const updatedMentors = mentors.filter(m => m.id !== mentorId);
    setMentors(updatedMentors);
    
    const updatedIds = favoriteIds.filter(id => id !== mentorId);
    setFavoriteIds(updatedIds);
    await AsyncStorage.setItem("favouriteMentors", JSON.stringify(updatedIds));

    try {
      await api.post(`${MentorEndpoints.toggleFavoriteMentor}${mentorId}/favorite`);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      // Revert on failure
      syncFavoritesList();
    }
  };

  useEffect(() => {
    syncFavoritesList();
  }, []);

  // Filter list locally based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDisplayedMentors(mentors);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = mentors.filter(
        m => m.name.toLowerCase().includes(query) || m.iit.toLowerCase().includes(query)
      );
      setDisplayedMentors(filtered);
    }
  }, [searchQuery, mentors]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    syncFavoritesList();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button & search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require("../../app-assets/arrow-back-up.svg")} style={styles.backIcon} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Image source={require("../../app-assets/search-icon.svg")} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search favorite mentors..."
            placeholderTextColor="#444653"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.titleText}>My Favorites</Text>
      </View>

      <FlatList
        data={displayedMentors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MentorCard
            {...item}
            isFavorite={favoriteIds.includes(item.id)}
            onFavoritePress={() => handleToggleFavorite(item.id)}
            onPress={() => navigation.navigate("MentorProfile", { mentor: item })}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#2563eb"]} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No favorite mentors found</Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginLeft: 12,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    width: 14,
    height: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: "#0b1c30",
  },
  titleRow: {
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#444653",
  },
});
