import React, { useEffect, useState, useCallback } from "react";
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, Dimensions, StyleSheet, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../services/retrieveKeys";
import { Image } from "expo-image";
import api from "../../services/api";
import { MentorEndpoints, CallEndpoints } from "../../constants/endpoint";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function MentorHomePage() {
  const { handleLogout } = useAuth();
  const navigation = useNavigation<any>();
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const loadCachedData = async () => {
    try {
      const cachedStats = await AsyncStorage.getItem("stats");
      if (cachedStats) {
        const parsedData = JSON.parse(cachedStats);
        setData(parsedData);
        setIsOnline(parsedData.profile.isOnline || false);
      }
    } catch (err) {
      console.error("Failed to load cached stats", err);
    }
  };

  const fetchData = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [statsRes, historyRes, conditionsRes] = await Promise.all([
        api.get(MentorEndpoints.getMeStats),
        api.get(CallEndpoints.getMentorSessions),
        api.get(MentorEndpoints.getPromotionConditions)
      ]);
      
      if (statsRes.status === 200) {
        const newData = statsRes.data;
        setData(newData);
        setIsOnline(newData.profile.isOnline || false);
        await AsyncStorage.setItem("stats", JSON.stringify(newData));
      }

      if (historyRes.status === 200) {
        setHistory(historyRes.data);
      }

      if (conditionsRes.status === 200) {
          // Conditions from dedicated endpoint
          // We can use these to override the ones in stats data if needed
      }
    } catch (err) {
      console.error("Failed to fetch mentor stats", err);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleOnlineStatus = async (value: boolean) => {
    try {
      setIsOnline(value);
      const response = await api.post(MentorEndpoints.setStatus, { isOnline: value });
      if (response.status !== 200) {
        // Rollback on failure
        setIsOnline(!value);
        console.error("Failed to toggle online status");
      }
    } catch (err) {
      setIsOnline(!value);
      console.error("Error toggling online status:", err);
    }
  };

  useEffect(() => {
    loadCachedData();
    fetchData(true); // Background fetch on mount
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData(true); // Background fetch on focus
    }, [])
  );

  const onRefresh = () => {
    fetchData();
  };

  if (!data) return null;

  const { profile, conditions, stats } = data;

  const getRequirements = (level: string) => {
      if (level === 'Verified') return ["KYC Verified", "College Verified"];
      const cond = conditions.find((c: any) => c.level === level);
      if (!cond) return ["Requirements TBD"];
      return [`${cond.minCalls} Completed Calls`, `${Number(cond.minRating).toFixed(1)}+ Average Rating`];
  };

  const getNextLevel = () => {
    if (profile.mentorlevel === "Verified") return "Standard";
    if (profile.mentorlevel === "Standard") return "Signature";
    if (profile.mentorlevel === "Signature") return "Fellow";
    return null;
  };

  const nextLevel = getNextLevel();
  const nextCond = conditions.find((c: any) => c.level === nextLevel);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header matching Node 377:2591 */}
        <View style={styles.header}>
            <View style={styles.headerBackground}>
                <Image source={require("../../app-assets/bg-pattern-inverted.svg")} style={styles.headerBgPattern} />
            </View>
            <View style={styles.headerContent}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity 
                        style={styles.profileSummary} 
                        onPress={() => navigation.navigate("MentorProfilePage")}
                    >
                        <View style={styles.avatarWrapper}>
                            <Image 
                                source={profile.photo_url || require("../../app-assets/avatar-placeholder.svg")} 
                                style={styles.headerAvatar} 
                            />
                            <Image source={require("../../app-assets/verified-check.svg")} style={styles.verifiedBadge} />
                        </View>
                        <View style={styles.nameContainer}>
                            <Text style={styles.greetingText}>Hi {profile.user?.name?.split(" ")[0] || "Mentor"}</Text>
                            <Text style={styles.collegeText}>{profile.iit_name}</Text>
                        </View>
                        <Image source={require("../../app-assets/edit-icon.svg")} style={styles.editIcon} tintColor="white" />
                    </TouchableOpacity>

                    <View style={styles.onlineToggleContainer}>
                        <Text style={[styles.onlineStatusText, { color: isOnline ? '#25d366' : '#fff' }]}>
                            {isOnline ? 'Online' : 'Offline'}
                        </Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#25d366" }}
                            thumbColor={"#f4f3f4"}
                            onValueChange={toggleOnlineStatus}
                            value={isOnline}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.withdrawButton}>
                    <Image source={require("../../app-assets/wallet-fill.svg")} style={styles.walletIcon} tintColor="#444653" />
                    <Text style={styles.withdrawText}>Withdraw</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Earning Stats matching Node 306:184 */}
        <View style={styles.statsRow}>
          <StatCard title="TODAY" amount={`₹${stats.today.earnings}`} subtitle={`${stats.today.count} calls`} />
          <StatCard title="WEEK" amount={`₹${stats.week.earnings}`} subtitle={`${stats.week.count} calls`} />
          <StatCard title="ALL TIME" amount={`₹${stats.allTime.earnings}`} subtitle={`${stats.allTime.count} calls`} />
        </View>

        {/* Progress Card matching Node 306:194 */}
        {nextLevel && (
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>YOUR PROGRESS</Text>
            <Text style={styles.nextLevelText}>Next Level : {nextLevel.toUpperCase()}</Text>

            <View style={styles.progressBarContainer}>
              <View style={[styles.iconCircle, { backgroundColor: '#25d366' }]}>
                <Image source={require("../../app-assets/mentoring-icon.svg")} style={styles.progressIcon} tintColor="white" />
              </View>
              <View style={styles.progressDetails}>
                <View style={styles.progressTextRow}>
                  <Text style={styles.progressSubLabel}>Call Completed</Text>
                  <Text style={styles.progressValue}>{profile.total_calls}/{nextCond?.minCalls || 0}</Text>
                </View>
                <View style={styles.barBackground}>
                   <View style={[styles.barFill, { backgroundColor: '#25d366', width: `${Math.min(profile.total_calls / (nextCond?.minCalls || 1), 1) * 100}%` }]} />
                </View>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={[styles.iconCircle, { backgroundColor: '#2563eb' }]}>
                <Image source={require("../../app-assets/star-icon.svg")} style={styles.progressIcon} tintColor="white" />
              </View>
              <View style={styles.progressDetails}>
                <View style={styles.progressTextRow}>
                  <Text style={styles.progressSubLabel}>Rating</Text>
                  <Text style={styles.progressValue}>{Number(profile.avg_rating).toFixed(1)}/{Number(nextCond?.minRating || 0).toFixed(1)}</Text>
                </View>
                <View style={styles.barBackground}>
                   <View style={[styles.barFill, { backgroundColor: '#2563eb', width: `${Math.min(Number(profile.avg_rating) / (Number(nextCond?.minRating) || 1), 1) * 100}%` }]} />
                </View>
              </View>
            </View>

            <Text style={styles.progressHint}>
                Complete {nextCond?.minCalls} calls and maintain {Number(nextCond?.minRating).toFixed(1)}+ rating to upgrade to {nextLevel} Mentor and charge up to ₹{levelRates[nextLevel]}/min
            </Text>
          </View>
        )}

        {/* History Section matching Node 373:1381 */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>History</Text>
        </View>
        <View style={styles.historyContainer}>
            {history.length > 0 ? (
                history.map((session) => (
                    <View key={session.id} style={styles.historyItem}>
                        <View style={styles.studentAvatar} />
                        <View style={styles.historyInfo}>
                            <View style={styles.historyTopRow}>
                                <Text style={styles.studentName}>{session.student?.name || "Student"}</Text>
                                <Text style={styles.earningText}>₹{session.mentorEarning || 0}</Text>
                            </View>
                            <View style={styles.historyBottomRow}>
                                <Text style={styles.durationText}>{Math.floor((session.durationSecs || 0) / 60)}m</Text>
                                <Text style={styles.dateText}>{formatRelativeDate(session.createdAt)}</Text>
                            </View>
                        </View>
                    </View>
                ))
            ) : (
                <Text style={styles.emptyText}>No recent calls</Text>
            )}
            <TouchableOpacity>
                <Text style={styles.moreText}>more</Text>
            </TouchableOpacity>
        </View>

        {/* Plans Section matching Node 331:2 */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>OUR PLANS</Text>
        </View>
        <View style={styles.plansContainer}>
            <PlanCard 
                level="Verified" 
                rate={7} 
                requirements={getRequirements("Verified")} 
                benefits={["Start earning immediately", "Get listed on the platform"]}
                active={profile.mentorlevel === 'Verified'} 
            />
            <PlanCard 
                level="Standard" 
                rate={10} 
                requirements={getRequirements("Standard")} 
                benefits={["Charge up to ₹10/min", "Better ranking in search"]}
                active={profile.mentorlevel === 'Standard'} 
            />
            <PlanCard 
                level="Signature" 
                rate={15} 
                requirements={getRequirements("Signature")} 
                benefits={["Charge up to ₹15/min", "Featured in search results"]}
                active={profile.mentorlevel === 'Signature'} 
            />
            <PlanCard 
                level="Fellow" 
                rate={20} 
                requirements={getRequirements("Fellow")} 
                benefits={["Highest earning potential", "Direct platform support"]}
                active={profile.mentorlevel === 'Fellow'} 
            />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const levelRates: any = {
    Verified: 7,
    Standard: 10,
    Signature: 15,
    Fellow: 20
}

function StatCard({ title, amount, subtitle }: any) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statAmount}>{amount}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );
}

function PlanCard({ level, rate, requirements, benefits, active }: any) {
    const getPlanBgColor = (lvl: string) => {
        if (lvl === 'Standard' || lvl === 'Signature') return '#3b4b6b';
        if (lvl === 'Fellow') return '#0a192f';
        return '#2563eb'; // Verified
    }

    const getPlanLeftBgColor = (lvl: string) => {
        if (lvl === 'Standard' || lvl === 'Signature') return '#fffdf0';
        if (lvl === 'Fellow') return '#fdf6d5';
        return 'white';
    }

    return (
        <View style={styles.planCardWrapper}>
            <View style={[styles.planBanner, { backgroundColor: getPlanBgColor(level) }]}>
                <View style={[styles.planBannerLeft, { backgroundColor: getPlanLeftBgColor(level) }]}>
                    <Image source={require("../../app-assets/logo.svg")} style={styles.planBannerIcon} />
                </View>
                
                <View style={styles.planBannerMiddle}>
                    <Text style={styles.planBannerLevel}>{level.toUpperCase()}</Text>
                    <Text style={styles.planBannerChargeLabel}>Charge up to</Text>
                    <Text style={styles.planBannerChargeValue}>₹{rate}<Text style={styles.planBannerChargeUnit}>/min</Text></Text>
                </View>

                <View style={styles.planBannerRight}>
                    {requirements.slice(0, 2).map((req: string, index: number) => (
                        <View key={index} style={styles.planBannerReqRow}>
                            <Image source={require("../../app-assets/tick-circle.svg")} style={styles.bannerTickIcon} tintColor="white" />
                            <Text style={styles.planBannerReqText} numberOfLines={1}>{req}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {active && (
                <View style={styles.planDetailsCard}>
                    <View style={styles.planDetailsHeader}>
                        <Text style={styles.planDetailsLabel}>Charge</Text>
                        <Text style={styles.planDetailsRate}>₹{rate}/min</Text>
                    </View>
                    
                    <View style={styles.planSection}>
                        <Text style={[styles.planSectionTitle, {color: '#2563eb'}]}>Requirements</Text>
                        {requirements.map((req: string) => (
                            <View key={req} style={styles.planRow}>
                                <Image source={require("../../app-assets/tick-circle.svg")} style={styles.tickIcon} tintColor="#25d366" />
                                <Text style={styles.planRowText}>{req}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.planSection}>
                        <Text style={[styles.planSectionTitle, {color: '#2563eb'}]}>Benefits</Text>
                        {benefits.map((ben: string) => (
                            <View key={ben} style={styles.planRow}>
                                <Image source={require("../../app-assets/tick-circle.svg")} style={styles.tickIcon} tintColor="#25d366" />
                                <Text style={styles.planRowText}>{ben}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    )
}

function formatRelativeDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1d";
    return `${diffDays}d`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    height: 160,
    position: 'relative',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#2563eb',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerBgPattern: {
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  onlineToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  onlineStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatarWrapper: {
    position: 'relative',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'white',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 16,
    height: 16,
  },
  nameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  collegeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  editIcon: {
    width: 12,
    height: 12,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-end',
    marginTop: -10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walletIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  withdrawText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#444653',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: -30,
    paddingHorizontal: 20,
  },
  statCard: {
    width: (width - 72) / 3,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#d7d7d7',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#444653',
    marginBottom: 8,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#25d366',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#444653',
  },
  progressCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444653',
    marginBottom: 4,
  },
  nextLevelText: {
    fontSize: 16,
    color: '#2563eb',
    marginBottom: 20,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 3.5,
    elevation: 4,
  },
  progressIcon: {
    width: 16,
    height: 16,
  },
  progressDetails: {
    flex: 1,
    marginLeft: 12,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressSubLabel: {
    fontSize: 12,
    color: '#444653',
  },
  progressValue: {
    fontSize: 12,
    color: '#444653',
  },
  barBackground: {
    height: 4,
    backgroundColor: '#f0f1f3',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressHint: {
    fontSize: 12,
    color: '#444653',
    lineHeight: 16,
    marginTop: 10,
  },
  sectionHeader: {
    paddingHorizontal: 36,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444653',
  },
  historyContainer: {
    paddingHorizontal: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  studentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#c0c0c0',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 16,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 16,
    color: 'black',
  },
  earningText: {
    fontSize: 12,
    color: '#25d366',
  },
  historyBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationText: {
    fontSize: 12,
    color: '#444653',
  },
  dateText: {
    fontSize: 12,
    color: '#2563eb',
  },
  moreText: {
    fontSize: 12,
    color: '#444653',
    marginLeft: 43,
    marginTop: 4,
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  planCardWrapper: {
    marginBottom: 0,
  },
  planBanner: {
    flexDirection: 'row',
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planBannerLeft: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planBannerIcon: {
    width: 32,
    height: 32,
  },
  planBannerMiddle: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  planBannerLevel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '300',
    marginBottom: 2,
  },
  planBannerChargeLabel: {
    color: 'white',
    fontSize: 11,
  },
  planBannerChargeValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  planBannerChargeUnit: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  planBannerRight: {
    justifyContent: 'center',
    paddingRight: 12,
    width: 130,
  },
  planBannerReqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bannerTickIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
  },
  planBannerReqText: {
    color: 'white',
    fontSize: 11,
    flex: 1,
  },
  planDetailsCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '90%',
    alignSelf: 'center',
  },
  planDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginBottom: 20,
  },
  planDetailsLabel: {
    fontSize: 12,
    color: '#4a4a4a',
  },
  planDetailsRate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  planSection: {
    marginBottom: 16,
  },
  planSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 10,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginLeft: 10,
  },
  tickIcon: {
    width: 12,
    height: 12,
    marginRight: 8,
  },
  planRowText: {
    fontSize: 12,
    color: '#4a4a4a',
  },
  logoutButton: {
    alignSelf: 'center',
    marginTop: 40,
    padding: 10,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#444653',
    marginVertical: 20,
  }
});
