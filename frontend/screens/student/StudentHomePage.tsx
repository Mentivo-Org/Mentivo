import React, { useEffect, useState, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Animated,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import MentorCard from "../../components/MentorCard";
import { useAuth } from "../../services/retrieveKeys";
import DialogBox from "../../components/DialogBox";
import api from "../../services/api";
import { WalletEndpoints } from "../../constants/endpoint";

const { width, height } = Dimensions.get("window");

export default function StudentHomePage() {
  const { handleLogout } = useAuth();
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;

  const [alertData, setAlertData] = useState({title: '', message: ''});
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  const fetchWalletBalance = async () => {
    try {
      const response = await api.get(WalletEndpoints.getBalance);
      if (response.status === 200) {
        setWalletBalance(response.data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    loadUser();
    fetchWalletBalance();
  }, []);

  const toggleSidebar = () => {
    if (isSidebarVisible) {
      Animated.timing(slideAnim, {
        toValue: -width * 0.7,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsSidebarVisible(false));
    } else {
      setIsSidebarVisible(true);
      fetchWalletBalance();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogoutClick = async () => {
    setAlertData({title: "Confirmation", message: "Are you sure you want to logout ?"});
    setAlertVisible(true);
  }

  const handleLogoutButtonYes = async () => {
    setAlertVisible(false);
    handleLogout();
  }

  const filters = ["All", "Online(3)", "Standard", "Premium"];

  // Mock data for mentors
  const mentors = [
    {
      id: "1",
      name: "Suraj Jain",
      iit: "IIT Guwahati",
      branch: "CSE",
      year: "Y3",
      rating: 4.6,
      calls: 125,
      price: 10,
      isFavorite: true,
      isOnline: true,
    },
    {
      id: "2",
      name: "Akshay Kumar",
      iit: "IIT BHU",
      branch: "Ceramic",
      year: "Y3",
      rating: 4.6,
      calls: 125,
      price: 10,
      isFavorite: false,
      isOnline: true,
    },
    {
      id: "3",
      name: "Rahman Dakait",
      iit: "IIT Delhi",
      branch: "MNC",
      year: "Y2",
      rating: 4.2,
      calls: 99,
      price: 10,
      isFavorite: true,
      isOnline: false,
    },
    {
      id: "4",
      name: "Tony Stark",
      iit: "IIT Jammu",
      branch: "Material",
      year: "Y1",
      rating: 4.6,
      calls: 126,
      price: 10,
      isFavorite: false,
      isOnline: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar}>
          <Image source={require("../../app-assets/sidebar-toggle.svg")} style={styles.icon24} />
        </TouchableOpacity>
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
        <TouchableOpacity>
          <Image source={require("../../app-assets/filter-icon.svg")} style={styles.icon24} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Greeting Card */}
        <View style={styles.greetingCard}>
          <View style={styles.greetingHeader}>
            <Text style={styles.greetingText}>Hey, Future IITian,</Text>
            <Text style={styles.userNameText}>{user?.name?.split(" ")[0] || "Anurag"}!</Text>
          </View>
          
          <View style={styles.separator} />

          <View style={styles.countdownRow}>
            <View style={styles.countdownItem}>
              <View style={styles.countdownValueContainer}>
                <Text style={styles.countdownValue}>98</Text>
                <View style={styles.countdownUnitContainer}>
                  <Text style={styles.countdownUnit}>Days</Text>
                  <Text style={styles.countdownUnit}>Left</Text>
                </View>
              </View>
              <Text style={styles.examText}>Jee Mains</Text>
            </View>

            <View style={styles.countdownItem}>
              <View style={styles.countdownValueContainer}>
                <Text style={styles.countdownValue}>130</Text>
                <View style={styles.countdownUnitContainer}>
                  <Text style={styles.countdownUnit}>Days</Text>
                  <Text style={styles.countdownUnit}>Left</Text>
                </View>
              </View>
              <Text style={styles.examText}>Jee Advanced</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.mentorSyncButton}>
            <Text style={styles.mentorSyncText}>Mentor Sync </Text>
            <View style={styles.syncTimerBadge}>
              <Text style={styles.syncTimerText}>in 10 min</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  selectedFilter === filter && styles.filterChipActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                {filter.includes("Online") && <View style={styles.onlineStatusDot} />}
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Mentor List */}
        <View style={styles.mentorList}>
          {mentors.map((mentor) => (
            <MentorCard
              key={mentor.id}
              {...mentor}
              onPress={() => navigation.navigate("MentorProfile", { mentorId: mentor.id })}
            />
          ))}
        </View>
      </ScrollView>

      {/* Sidebar Overlay */}
      {isSidebarVisible && (
        <View style={styles.sidebarOverlay}>
          <TouchableWithoutFeedback onPress={toggleSidebar}>
            <View style={styles.overlayBackground} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.sidebarHeader}>
              <Image source={require("../../app-assets/logo.svg")} style={styles.sidebarLogoIcon} />
              <Text style={styles.sidebarLogoText}>entivo</Text>
            </View>

            <View style={styles.sidebarUserCard}>
              <Image source={require("../../app-assets/profile-circle.svg")} style={styles.userAvatar} />
              <View style={styles.userInfo}>
                <Text style={styles.sidebarUserName}>{user?.name || "Raju Rastogi"}</Text>
                <Text style={styles.sidebarUserRole}>JEE 2027 Aspirant</Text>
                <TouchableOpacity style={styles.editButton}>
                  <Image source={require("../../app-assets/edit-icon.svg")} style={styles.editIcon} />
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sidebarStatsRow}>
              <View style={styles.sidebarStatCard}>
                <Image source={require("../../app-assets/wallet-fill.svg")} style={styles.sidebarStatIcon} />
                <View>
                  <Text style={styles.walletBalance}>₹ {walletBalance}</Text>
                  <Text style={styles.walletBonus}>+9m free</Text>
                </View>
              </View>
              <View style={styles.sidebarStatCard}>
                <Image source={require("../../app-assets/heart-icon.svg")} style={styles.sidebarStatIcon} tintColor="#2563eb" />
                <View>
                  <Text style={styles.statLabel}>My</Text>
                  <Text style={styles.statSubLabel}>Favourite</Text>
                </View>
              </View>
            </View>

            <View style={styles.sidebarLinks}>
              <TouchableOpacity style={styles.sidebarLink} onPress={() => { toggleSidebar(); navigation.navigate("YourSession"); }}>
                <Text style={styles.sidebarLinkText}>Your session</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarLink} onPress={() => { toggleSidebar(); navigation.navigate("Payment"); }}>
                <Text style={styles.sidebarLinkText}>Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sidebarLink, styles.logoutLink]} onPress={handleLogoutClick}>
                <Text style={styles.sidebarLinkText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
      <DialogBox
       title={alertData.title}
       message={alertData.message} 
       visible={alertVisible} 
       onClose={() => setAlertVisible(false)} 
       primaryButtonText="YES" 
       secondaryButtonText="CANCEL" 
       onPrimaryPress={handleLogoutButtonYes} 
       onSecondaryPress={() => setAlertVisible(false)}
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  icon24: {
    width: 24,
    height: 24,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 12,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greetingCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  greetingHeader: {
    marginBottom: 12,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "black",
    letterSpacing: -1.2,
  },
  userNameText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1d459c",
    letterSpacing: -1.2,
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
    width: "60%",
  },
  countdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  countdownItem: {
    flex: 1,
  },
  countdownValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  countdownValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1d459c",
    marginRight: 4,
  },
  countdownUnitContainer: {
    justifyContent: "center",
  },
  countdownUnit: {
    fontSize: 10,
    color: "#444653",
    lineHeight: 12,
  },
  examText: {
    fontSize: 12,
    color: "#444653",
    marginTop: -4,
  },
  mentorSyncButton: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
  },
  mentorSyncText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    marginRight: 8,
  },
  syncTimerBadge: {
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  syncTimerText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "bold",
  },
  filterContainer: {
    marginVertical: 20,
  },
  filterChip: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: "#2563eb",
  },
  filterText: {
    fontSize: 12,
    color: "black",
  },
  filterTextActive: {
    color: "white",
  },
  onlineStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 6,
  },
  mentorList: {
    marginTop: 10,
  },
  sidebarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: "#f5f5f5",
    paddingTop: 20,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 10,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginLeft: 10,
  },
  sidebarLogoIcon: {
    width: 14,
    height: 15,
  },
  sidebarLogoText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "black",
    marginLeft: 2,
  },
  sidebarUserCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  sidebarUserName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  sidebarUserRole: {
    fontSize: 12,
    color: "#444653",
    marginTop: 2,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: "black",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  editIcon: {
    width: 10,
    height: 10,
    marginRight: 4,
  },
  editText: {
    fontSize: 10,
    color: "black",
  },
  sidebarStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  sidebarStatCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sidebarStatIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  walletBalance: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1d459c",
  },
  walletBonus: {
    fontSize: 8,
    color: "#10b981",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1d459c",
  },
  statSubLabel: {
    fontSize: 8,
    color: "#444653",
  },
  sidebarLinks: {
    marginTop: 10,
  },
  sidebarLink: {
    paddingVertical: 15,
  },
  sidebarLinkText: {
    fontSize: 16,
    color: "#444653",
  },
  logoutLink: {
    marginTop: 20,
  },
});
