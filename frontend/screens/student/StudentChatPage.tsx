import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function StudentChatPage() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState("");

  const favourites = [
    { id: "1", name: "Suraj Jain", iit: "IIT Guwahati" },
    { id: "2", name: "Gurvindar", iit: "IIT Delhi" },
    { id: "3", name: "Suraj Jain", iit: "IIT Dwarka" },
  ];

  const recentCalls = [
    { id: "4", name: "Suraj Jain", iit: "IIT Guwahati", day: "Friday", unread: 1 },
    { id: "5", name: "Vidur", iit: "IIT BHU", day: "Sunday" },
    { id: "6", name: "Rhon. v", iit: "IIT Kanpur", day: "Monday" },
    { id: "7", name: "Suraj Raj", iit: "IIT Patna", day: "Saturday" },
  ];

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favourites</Text>
          <FlatList
            data={favourites}
            renderItem={renderFavourite}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.favouriteList}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent</Text>
          {recentCalls.map((item) => (
            <React.Fragment key={item.id}>
              {renderRecentCall({ item })}
            </React.Fragment>
          ))}
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
    color: "#2563eb",
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: "#2563eb",
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
});
