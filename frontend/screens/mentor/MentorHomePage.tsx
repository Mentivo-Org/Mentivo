import React, { useEffect, useState, useCallback } from "react";
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, Dimensions, StyleSheet } from "react-native";
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

  const loadCachedData = async () => {
    try {
      const cachedStats = await AsyncStorage.getItem("stats");
      if (cachedStats) {
        const parsedData = JSON.parse(cachedStats);
        setData(parsedData);
      }
    } catch (err) {
      console.error("Failed to load cached stats", err);
    }
  };

  const fetchData = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        api.get(MentorEndpoints.getMeStats),
        api.get(CallEndpoints.getMentorSessions)
      ]);
      
      if (statsRes.status === 200) {
        const newData = statsRes.data;
        // Compare with current data to avoid unnecessary re-renders if possible
        // but always save to storage for persistence
        setData(newData);
        await AsyncStorage.setItem("stats", JSON.stringify(newData));
      }

      if (historyRes.status === 200) {
        setHistory(historyRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch mentor stats", err);
    } finally {
      setRefreshing(false);
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
                requirements={["KYC Verified", "College Verified"]} 
                benefits={["Start earning immediately", "Get listed on the platform"]}
                active={profile.mentorlevel === 'Verified'} 
            />
            <PlanCard 
                level="Standard" 
                rate={10} 
                requirements={["35 Completed Calls", "4.5+ Average Rating"]} 
                benefits={["Charge higher up to 10/min", "Better ranking in search results"]}
                active={profile.mentorlevel === 'Standard'} 
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
    return (
        <View style={[styles.planCard, active && styles.activePlanCard]}>
            <View style={styles.planHeader}>
                <Text style={styles.planRateLabel}>Charge</Text>
                <Text style={[styles.planRateValue, active && {color: '#2563eb'}]}>₹{rate}/min</Text>
            </View>
            
            <View style={styles.planSection}>
                <Text style={[styles.planSectionTitle, active && {color: '#2563eb'}]}>Requirements</Text>
                {requirements.map((req: string) => (
                    <View key={req} style={styles.planRow}>
                        <Image source={require("../../app-assets/verified-check.svg")} style={styles.tickIcon} />
                        <Text style={styles.planRowText}>{req}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.planSection}>
                <Text style={[styles.planSectionTitle, active && {color: '#2563eb'}]}>Benefits</Text>
                {benefits.map((ben: string) => (
                    <View key={ben} style={styles.planRow}>
                        <Image source={require("../../app-assets/verified-check.svg")} style={styles.tickIcon} />
                        <Text style={styles.planRowText}>{ben}</Text>
                    </View>
                ))}
            </View>

            {active && (
                <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>CURRENT</Text>
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
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 20,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
  },
  activePlanCard: {
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  planRateLabel: {
    fontSize: 12,
    color: '#4a4a4a',
  },
  planRateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a4a4a',
  },
  planSection: {
    marginBottom: 16,
  },
  planSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3b507d',
    marginBottom: 10,
    marginLeft: 24,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginLeft: 24,
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
  currentBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'white',
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
