import React, { useEffect, useState, useRef, useCallback } from "react";
import { useTabPressRefresh } from "../../hooks/useTabPressRefresh";
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
  ActivityIndicator,
  RefreshControl,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { storage } from "../../services/storage";
import { useNavigation, useRoute, useScrollToTop } from "@react-navigation/native";
import MentorCard from "../../components/MentorCard";
import { useAuth } from "../../services/retrieveKeys";
import { useLoading } from "../../context/LoadingContext";
import DialogBox from "../../components/DialogBox";
import api from "../../services/api";
import { WalletEndpoints, MentorEndpoints, LoginEndpoints, CallEndpoints, ConfigEndpoint } from "../../constants/endpoint";
import useSWR, { mutate } from "swr";
import { Skeleton } from "../../components/Skeleton";
import { useSettings } from "../../context/SettingsContext";

const { width, height } = Dimensions.get("window");

export default function StudentHomePage() {
  const { handleLogout, user: authUser } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [sortBy, setSortBy] = useState("rating");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [tempSelectedLevel, setTempSelectedLevel] = useState("All");
  const [tempSortBy, setTempSortBy] = useState("rating");
  const [tempLanguage, setTempLanguage] = useState("");
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;
  const flatListRef = useRef<FlatList>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useScrollToTop(flatListRef);

  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    primaryButtonText?: string;
    secondaryButtonText?: string;
    onPrimaryPress?: () => void;
    onSecondaryPress?: () => void;
  }>({title: '', message: ''});
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  // Pagination states
  const [mentors, setMentors] = useState<any[]>([]);
  const [displayedMentors, setDisplayedMentors] = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [upcomingCall, setUpcomingCall] = useState<any>(null);
  const [syncCountdown, setSyncCountdown] = useState<string>("");
  const { settings } = useSettings();
  const [isFirstCallFree, setIsFirstCallFree] = useState(false);
  const [showSyncButton, setShowSyncButton] = useState(false);
  const LIMIT = 10;

  const fetchUpcomingCall = async () => {
    try {
      const response = await api.get(CallEndpoints.getUpcoming);
      if (response.status === 200 && response.data) {
        setUpcomingCall(response.data);
        calculateCountdown(response.data.scheduledAt);
      } else {
        setUpcomingCall(null);
        setSyncCountdown("");
        setShowSyncButton(false);
      }
    } catch (error) {
      console.error("Failed to fetch upcoming call:", error);
    }
  };

  const calculateCountdown = (scheduledAt: string) => {
    const now = new Date();
    const target = new Date(scheduledAt);
    const diffMs = target.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      setSyncCountdown("Now");
      setShowSyncButton(true);
      return;
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins <= 10) {
      setShowSyncButton(true);
    } else {
      setShowSyncButton(false);
    }

    if (diffMins < 60) {
      setSyncCountdown(`in ${diffMins} min`);
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      setSyncCountdown(`in ${hours}h ${mins}m`);
    }
  };

  const fetchSettingsAndEligibility = async () => {
    try {
      const whoAmIRes = await api.get(LoginEndpoints.whoAmI);
      if (whoAmIRes.status === 200) {
        setIsFirstCallFree(whoAmIRes.data.user?.isFreeAvailable === true);
      }
    } catch (err) {
      console.error("Failed to fetch settings/eligibility:", err);
    }
  };

  const handleSyncMentor = async () => {
    if (!upcomingCall || !upcomingCall.mentor) return;
    
    if (walletBalance < 10) {
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

    showLoading("Syncing with mentor...");
    try {
      const response = await api.post(CallEndpoints.initiate, { mentorId: upcomingCall.mentor_id });
      if (response.status === 200) {
        const { sessionId, channelName, studentToken, maxDurationSeconds, mentorPhoto, chatSessionId } = response.data;
        
        navigation.navigate('InCall', {
          callId: sessionId,
          channelName,
          callerName: upcomingCall.mentor.name || "Mentor",
          role: 'caller',
          initialToken: studentToken,
          maxDuration: maxDurationSeconds,
          mentorPhoto: mentorPhoto || upcomingCall.mentor.photo_url,
          chatSessionId
        });
      }
    } catch (error: any) {
      console.error('Failed to initiate scheduled call:', error);
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

  const handleCardCallPress = useCallback(async (mentor: any) => {
    if (walletBalance < 10) {
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

    showLoading("Initiating call...");
    try {
      const response = await api.post(CallEndpoints.initiate, { mentorId: mentor.id });
      if (response.status === 200) {
        const { sessionId, channelName, studentToken, maxDurationSeconds, mentorPhoto, chatSessionId } = response.data;

        navigation.navigate('InCall', {
          callId: sessionId,
          channelName,
          callerName: mentor.name,
          role: 'caller',
          initialToken: studentToken,
          maxDuration: maxDurationSeconds,
          mentorPhoto: mentorPhoto || mentor.photoUrl,
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
  }, [walletBalance, navigation, showLoading, hideLoading]);

  const handleFreeMatchmaking = async () => {
    showLoading("Finding a mentor...");
    try {
      const response = await api.post(CallEndpoints.freeMatchmaking);
      if (response.status === 200) {
        const { sessionId, channelName, studentToken, maxDurationSeconds, mentorPhoto, chatSessionId, mentorName } = response.data;
        
        navigation.navigate('InCall', {
          callId: sessionId,
          channelName,
          callerName: mentorName || "Mentor",
          role: 'caller',
          initialToken: studentToken,
          maxDuration: maxDurationSeconds,
          mentorPhoto,
          chatSessionId
        });
      }
    } catch (error: any) {
      console.error('Failed to matchmaking free call:', error);
      const errorMsg = error.response?.data?.error || 'No mentors are online right now. Please try again later!';
      setAlertData({ title: 'Matchmaking Error', message: errorMsg });
      setAlertVisible(true);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (upcomingCall) {
      interval = setInterval(() => {
        calculateCountdown(upcomingCall.scheduledAt);
      }, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [upcomingCall]);

  useEffect(() => {
    if (route.params?.showMissedFreeCallAlert) {
      setAlertData({
        title: "Mentor Didn't Answer",
        message: "The mentor did not answer your free call. Would you like to try matchmaking again?",
        primaryButtonText: "TRY AGAIN",
        secondaryButtonText: "LATER",
        onPrimaryPress: () => {
          setAlertVisible(false);
          navigation.setParams({ showMissedFreeCallAlert: undefined });
          handleFreeMatchmaking();
        },
        onSecondaryPress: () => {
          setAlertVisible(false);
          navigation.setParams({ showMissedFreeCallAlert: undefined });
        }
      });
      setAlertVisible(true);
    }
  }, [route.params?.showMissedFreeCallAlert]);

  useEffect(() => {
    if (route.params?.showCallRejectedAlert) {
      setAlertData({
        title: "Call Declined",
        message: "The mentor is currently busy and declined the call.",
        primaryButtonText: "OK",
        onPrimaryPress: () => {
          setAlertVisible(false);
          navigation.setParams({ showCallRejectedAlert: undefined });
        }
      });
      setAlertVisible(true);
    }
  }, [route.params?.showCallRejectedAlert]);

  const syncFavorites = useCallback(async () => {
    try {
      // 1. Load from AsyncStorage immediately for fast UI
      const localFavs = await storage.getItem("favouriteMentors");
      if (localFavs) {
        setFavoriteIds(JSON.parse(localFavs));
      }

      // Read from AuthContext (already synced from server by RootNavigator)
      const serverFavs = authUser?.favouriteMentors ?? [];
      if (serverFavs.length > 0 || !localFavs) {
        setFavoriteIds(serverFavs);
        await storage.setItem('favouriteMentors', JSON.stringify(serverFavs));
      }
    } catch (error) {
      console.error("Failed to sync favorites:", error);
    }
  }, [authUser]);

  const handleToggleFavorite = useCallback(async (mentorId: string) => {
    // Optimistic UI update
    let updatedFavs;
    if (favoriteIds.includes(mentorId)) {
      updatedFavs = favoriteIds.filter(id => id !== mentorId);
    } else {
      updatedFavs = [...favoriteIds, mentorId];
    }

    setFavoriteIds(updatedFavs);
    await storage.setItem("favouriteMentors", JSON.stringify(updatedFavs));

    // Server request
    try {
      await api.post(`${MentorEndpoints.toggleFavoriteMentor}${mentorId}/favorite`);
    } catch (error) {
      console.error("Failed to toggle favorite on server:", error);
      // Revert if failed
      syncFavorites();
    }
  }, [favoriteIds, syncFavorites]);

  const handleMentorPress = useCallback((mentor: any) => {
    navigation.navigate("MentorProfile", { mentor: { ...mentor, isFavorite: favoriteIds.includes(mentor.id) } });
  }, [navigation, favoriteIds]);

  const renderMentorItem = useCallback(({ item }: { item: any }) => (
    <MentorCard
      {...item}
      item={item}
      isFavorite={favoriteIds.includes(item.id)}
      onFavoritePress={handleToggleFavorite}
      onCallPress={handleCardCallPress}
      onPress={handleMentorPress}
    />
  ), [favoriteIds, handleToggleFavorite, handleCardCallPress, handleMentorPress]);

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

  const fetchOnlineCount = async () => {
    try {
      const response = await api.get(MentorEndpoints.getOnlineCount);
      if (response.status === 200) {
        setOnlineCount(response.data.count);
      }
    } catch (error) {
      console.error("Failed to fetch online count:", error);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setDisplayedMentors(mentors);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase();
    
    // Local Search
    const localResults = mentors.filter(m => m.iit.toLowerCase().includes(lowerQuery));
    
    if (localResults.length > 0) {
      setDisplayedMentors(localResults);
      setIsSearching(false);
      return;
    }

    // Remote Search Fallback
    try {
      const response = await api.get(`${MentorEndpoints.searchMentors}?iitName=${query}`);
      if (response.status === 200) {
        const fetchedMentors = response.data.map((m: any) => ({
          id: m.mentorId,
          name: m.user?.name || "Unknown",
          iit: m.iit_name || "IIT Delhi",
          branch: m.branch || "CSE",
          year: `Y${m.year}`,
          rating: m.avg_rating || 0,
          calls: m.total_calls || 0,
          price: m.rate_per_min || 10,
          originalPrice: m.originalPrice || null,
          isFavorite: false,
          isOnline: m.isOnline,
          photoUrl: m.user?.photo_url,
          mentorlevel: m.mentorlevel,
        }));
        setDisplayedMentors(fetchedMentors);
      }
    } catch (err) {
      console.error("Remote search failed:", err);
      setDisplayedMentors([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, mentors]);

  const fetcherWithParams = ([url, params]: [string, any]) => api.get(url, { params }).then(res => res.data);

  const queryParams = {
    offset,
    limit: LIMIT,
    onlineOnly: selectedFilter === "Online",
    sortBy,
    level: selectedLevel,
    language: selectedLanguage,
  };

  const { data: fetchResult, error: mentorsError, isLoading } = useSWR(
    searchQuery.trim() ? null : [MentorEndpoints.getMentorsPaginated, queryParams],
    fetcherWithParams
  );

  useEffect(() => {
    if (fetchResult) {
      const formattedMentors = fetchResult.map((m: any) => ({
        id: m.mentorId,
        name: m.user?.name || "Unknown",
        iit: m.iit_name || "IIT Delhi",
        branch: m.branch || "CSE",
        year: `Y${m.year}`,
        rating: m.avg_rating || 0,
        calls: m.total_calls || 0,
        price: m.rate_per_min || 10,
        originalPrice: m.originalPrice || null,
        isFavorite: favoriteIds.includes(m.mentorId),
        isOnline: m.isOnline,
        photoUrl: m.user?.photo_url,
        mentorlevel: m.mentorlevel,
      }));

      setHasMore(formattedMentors.length === LIMIT);

      if (offset === 0) {
        setMentors(formattedMentors);
        if (!searchQuery.trim()) {
          setDisplayedMentors(formattedMentors);
        }
      } else {
        setMentors(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newMentors = formattedMentors.filter((p: any) => !existingIds.has(p.id));
          const updated = [...prev, ...newMentors];
          if (!searchQuery.trim()) {
            setDisplayedMentors(updated);
          }
          return updated;
        });
      }
      setIsRefreshing(false);
    }
  }, [fetchResult, offset, favoriteIds]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setOffset(0);
    fetchWalletBalance();
    fetchOnlineCount();
    fetchUpcomingCall();
    fetchSettingsAndEligibility();
    await mutate([MentorEndpoints.getMentorsPaginated, { ...queryParams, offset: 0 }]);
    setIsRefreshing(false);
  };

  useTabPressRefresh(navigation, handleRefresh);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await storage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    loadUser();

    const unsubscribeFocus = navigation.addListener('focus', () => {
      loadUser();
      fetchWalletBalance();
      fetchUpcomingCall();
      fetchSettingsAndEligibility();
    });

    syncFavorites();
    fetchWalletBalance();
    fetchOnlineCount();
    fetchUpcomingCall();
    fetchSettingsAndEligibility();

    return () => {
      unsubscribeFocus();
    };
  }, [navigation]);

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
    setOffset(0);
  }, [selectedFilter, selectedLevel, sortBy, selectedLanguage]);

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
    setAlertData({
      title: "Confirmation",
      message: "Are you sure you want to logout ?",
      primaryButtonText: "YES",
      secondaryButtonText: "CANCEL",
      onPrimaryPress: handleLogoutButtonYes,
      onSecondaryPress: () => setAlertVisible(false)
    });
    setAlertVisible(true);
  }

  const handleLogoutButtonYes = async () => {
    setAlertVisible(false);
    handleLogout();
  }

  const filters = ["All", "Online"];

  const sortOptions = [
    { label: "Rating (High to Low)", value: "rating" },
    { label: "Number of Calls", value: "calls" },
  ];

  const renderHeader = () => (
    <View>
      {/* Greeting Card */}
      <View style={styles.greetingCard}>
        <View style={styles.greetingHeader}>
          <Text style={styles.greetingText}>Hey, Future IITian,</Text>
          <Text style={styles.userNameText}>{user?.name?.split(" ")[0] || "Anurag"}</Text>
        </View>
        
        <View style={styles.separator} />

        {isFirstCallFree && settings?.free_call_enabled !== 'false' ? (
          <TouchableOpacity style={styles.freeCallBanner} onPress={handleFreeMatchmaking}>
            <View style={styles.freeCallRow}>
              <Image source={require("../../app-assets/clock.svg")} style={styles.freeCallIcon} tintColor="white" />
              <Text style={styles.freeCallTitle}>Your IITian, One Call Away First session free for new users</Text>
            </View>
            <Text style={styles.freeCallSubtitle}>Tap to match with an online mentor instantly!</Text>
          </TouchableOpacity>
        ) : showSyncButton && syncCountdown ? (
          <TouchableOpacity style={styles.mentorSyncButton} onPress={handleSyncMentor}>
            <Text style={styles.mentorSyncText}>Sync Mentor</Text>
            <View style={styles.syncTimerBadge}>
              <Text style={styles.syncTimerText}>{syncCountdown}</Text>
            </View>
          </TouchableOpacity>
        ) : (settings.promotionalText || settings.announcement) ? (
          <View style={styles.noSyncContainer}>
            {settings.promotionalText ? (
              <Text style={styles.greetingPromoText}>{settings.promotionalText}</Text>
            ) : null}
            {settings.announcement ? (
              <Text style={[styles.greetingAnnouncementText, settings.promotionalText && { marginTop: 6 }]}>
                {settings.announcement}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.noSyncContainer}>
            <Text style={styles.noSyncText}>No calls scheduled for today</Text>
          </View>
        )}
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
              {filter.includes("Online") && (
                <>
                  <View style={styles.onlineStatusDot} />
                  <Text
                    style={[
                      styles.filterText,
                      selectedFilter === filter && styles.filterTextActive,
                    ]}
                  >
                    Online({onlineCount})
                  </Text>
                </>
              )}
              {!filter.includes("Online") && (
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading) return <View style={{ height: 100 }} />; // Padding for tab bar when not loading
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#0077CB" />
      </View>
    );
  };

  const isFilterApplied = selectedLanguage !== "" || selectedLevel !== "All" || sortBy !== "rating";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Search */}
       <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar}>
          <Image source={require("../../app-assets/sidebar-toggle.svg")} style={[styles.icon24, {marginTop: '50%'}]} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Image source={require("../../app-assets/search-icon.svg")} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search mentor by IIT name"
            placeholderTextColor="#444653"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.walletHeaderButton} onPress={() => navigation.navigate("Payment")}>
          <Image source={require("../../app-assets/wallet-fill.svg")} style={styles.walletHeaderIcon} tintColor="#0077CB" />
          <Text style={styles.walletHeaderBalance}>{walletBalance}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterHeaderButton} onPress={() => {
          setTempSortBy(sortBy);
          setTempSelectedLevel(selectedLevel);
          setTempLanguage(selectedLanguage);
          setIsSortModalVisible(true);
        }}>
          <Image source={require("../../app-assets/filter-icon.svg")} style={styles.filterHeaderIcon} tintColor="#444653" />
          <Text style={styles.filterHeaderLabel}>Filter</Text>
          {isFilterApplied && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={displayedMentors}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderMentorItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={() => {
          if (!searchQuery.trim() && hasMore && !isLoading) {
            setOffset(prev => prev + LIMIT);
          }
        }}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#0077CB"]} />
        }
        ListEmptyComponent={
          isLoading && offset === 0 ? (
            <View style={{ paddingHorizontal: '5%' }}>
              {[1, 2, 3].map((key) => (
                <View key={key} style={{ backgroundColor: 'white', borderRadius: 8, height: 120, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f0f0f0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                  <Skeleton style={{ width: 64, height: 64, borderRadius: 32, marginRight: 16 }} />
                  <View style={{ flex: 1 }}>
                    <Skeleton style={{ width: 120, height: 20, borderRadius: 10, marginBottom: 8 }} />
                    <Skeleton style={{ width: 160, height: 16, borderRadius: 8, marginBottom: 6 }} />
                    <Skeleton style={{ width: 80, height: 14, borderRadius: 7 }} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No mentors found</Text>
            </View>
          )
        }
      />

      <Modal
        visible={isSortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : (isKeyboardVisible ? 'padding' : undefined)}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
        >
          <TouchableWithoutFeedback onPress={() => setIsSortModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.sortModalContent}>
                  <Text style={styles.modalTitle}>Sort By</Text>
                  {sortOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.sortOption}
                      onPress={() => {
                        setTempSortBy(option.value);
                      }}
                    >
                      <Text style={[
                        styles.sortOptionText,
                        tempSortBy === option.value && styles.sortOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                      {tempSortBy === option.value && (
                        <View style={styles.selectedDot} />
                      )}
                    </TouchableOpacity>
                  ))}

                  <Text style={[styles.modalTitle, { marginTop: 20, marginBottom: 10 }]}>Mentor Level</Text>
                  <View style={styles.levelContainer}>
                    {["All", "Standard", "Signature", "Fellow"].map((lvl) => (
                      <TouchableOpacity
                        key={lvl}
                        style={[
                          styles.levelOption,
                          tempSelectedLevel === lvl && styles.levelOptionActive
                        ]}
                        onPress={() => setTempSelectedLevel(lvl)}
                      >
                        <Text style={[
                          styles.levelOptionText,
                          tempSelectedLevel === lvl && styles.levelOptionTextActive
                        ]}>
                          {lvl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.modalTitle, { marginTop: 20, marginBottom: 10 }]}>Language</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. English, Hindi"
                    placeholderTextColor="#757684"
                    value={tempLanguage}
                    onChangeText={setTempLanguage}
                  />

                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={styles.clearButton} 
                      onPress={() => {
                        setTempLanguage("");
                        setTempSelectedLevel("All");
                        setSelectedLanguage("");
                        setSelectedLevel("All");
                        setIsSortModalVisible(false);
                      }}
                    >
                      <Text style={styles.clearButtonText}>Clear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.applyButton} 
                      onPress={() => {
                        setSelectedLanguage(tempLanguage);
                        setSelectedLevel(tempSelectedLevel);
                        setSortBy(tempSortBy);
                        setIsSortModalVisible(false);
                      }}
                    >
                      <Text style={styles.applyButtonText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Sidebar Overlay */}
      <Modal
        visible={isSidebarVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleSidebar}
      >
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
              <Image 
                source={user?.photo_url ? { uri: user.photo_url } : require("../../app-assets/profile-circle.svg")} 
                style={styles.userAvatar} 
              />
              <View style={styles.userInfo}>
                <Text style={styles.sidebarUserName}>{user?.name || "Raju Rastogi"}</Text>
                <Text style={styles.sidebarUserRole}>JEE 2027 Aspirant</Text>
                <TouchableOpacity 
                   style={styles.editButton}
                   onPress={() => {
                     toggleSidebar();
                     navigation.navigate("StudentProfilePage");
                   }}
                >
                  <Image source={require("../../app-assets/edit-icon.svg")} style={styles.editIcon} />
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sidebarStatsRow}>
              <TouchableOpacity 
                style={styles.sidebarStatCard}
                onPress={() => { toggleSidebar(); navigation.navigate("Payment"); }}
              >
                <Image source={require("../../app-assets/wallet-fill.svg")} style={styles.sidebarStatIcon} />
                <View>
                  <Text style={styles.walletBalance}>{walletBalance} Credits</Text>
                </View>
              </TouchableOpacity>
              {/* <View style={styles.sidebarStatCard}> */}
                <TouchableOpacity onPress={() => { toggleSidebar(); navigation.navigate("FavoriteMentors"); }} style={styles.sidebarStatCard}>
                <Image source={require("../../app-assets/heart-icon.svg")} style={styles.sidebarStatIcon} tintColor="#0077CB" />
                <View>
                  <Text style={styles.statLabel}>My</Text>
                  <Text style={styles.statSubLabel}>Favourite</Text>
                </View>
                </TouchableOpacity>
              {/* </View> */}
            </View>

            <View style={styles.sidebarLinks}>
              <TouchableOpacity style={styles.sidebarLink} onPress={() => { toggleSidebar(); navigation.navigate("YourSession"); }}>
                <Text style={styles.sidebarLinkText}>Your session</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sidebarLink} onPress={() => { toggleSidebar(); navigation.navigate("Payment"); }}>
                <Text style={styles.sidebarLinkText}>Session Credits</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sidebarLink, styles.logoutLink]} onPress={handleLogoutClick}>
                <Text style={styles.sidebarLinkText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
      <DialogBox
       title={alertData.title}
       message={alertData.message} 
       visible={alertVisible} 
       onClose={() => {
         setAlertVisible(false);
         if (alertData.onSecondaryPress) {
           alertData.onSecondaryPress();
         } else if (alertData.onPrimaryPress) {
           alertData.onPrimaryPress();
         }
       }} 
       primaryButtonText={alertData.primaryButtonText || "OK"} 
       secondaryButtonText={alertData.secondaryButtonText} 
       onPrimaryPress={() => {
         setAlertVisible(false);
         if (alertData.onPrimaryPress) {
           alertData.onPrimaryPress();
         }
       }} 
       onSecondaryPress={() => {
         setAlertVisible(false);
         if (alertData.onSecondaryPress) {
           alertData.onSecondaryPress();
         }
       }}
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
  walletHeaderButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    minWidth: 50,
    backgroundColor: 'white',
  },
  walletHeaderIcon: {
    width: 18,
    height: 18,
    marginBottom: 2,
  },
  walletHeaderBalance: {
    fontSize: 9,
    color: '#0077CB',
    fontWeight: 'bold',
  },
  filterHeaderButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    minWidth: 50,
    backgroundColor: 'white',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  filterHeaderIcon: {
    width: 18,
    height: 18,
    marginBottom: 2,
  },
  filterHeaderLabel: {
    fontSize: 9,
    color: '#444653',
    fontWeight: 'bold',
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
  greetingInfoContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 10,
  },
  greetingPromoText: {
    color: "#0077CB",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: 'center'
  },
  greetingAnnouncementText: {
    color: "#4b5563",
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center'
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
    color: "#0077CB",
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
    color: "#0077CB",
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
    backgroundColor: "#0077CB",
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
  },
  filterChip: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 10,
    marginTop: 16,
    marginBottom: 27,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: "#0077CB",
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
    color: "#0077CB",
  },
  walletBonus: {
    fontSize: 8,
    color: "#10b981",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0077CB",
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
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 20,
    color: '#444653',
    textAlign: 'center',
  },
  noSyncContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  noSyncText: {
    fontSize: 12,
    color: '#444653',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sortModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b1c30',
    marginBottom: 20,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#444653',
  },
  sortOptionTextActive: {
    color: '#0077CB',
    fontWeight: 'bold',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0077CB',
  },
  levelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    marginTop: 5,
  },
  levelOption: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'white',
  },
  levelOptionActive: {
    borderColor: '#0077CB',
    backgroundColor: '#e6f2fa',
  },
  levelOptionText: {
    fontSize: 12,
    color: '#444653',
  },
  levelOptionTextActive: {
    color: '#0077CB',
    fontWeight: 'bold',
  },
  promoBanner: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginHorizontal: 16,
  },
  promoText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  freeCallBanner: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  freeCallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  freeCallIcon: {
    width: 18,
    height: 18,
  },
  freeCallTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  freeCallSubtitle: {
    color: '#e0f2fe',
    fontSize: 11,
    marginLeft: 26,
  },
  announcementBanner: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginHorizontal: 16,
  },
  announcementText: {
    color: '#b45309',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#4b5563',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#0077CB',
    borderRadius: 8,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
