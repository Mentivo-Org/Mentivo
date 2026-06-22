import React, { useEffect, useState, useCallback } from "react";
import { Text, View, ScrollView, TouchableOpacity, RefreshControl, Dimensions, StyleSheet, Switch, LayoutAnimation, Platform, UIManager, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import api from "../../services/api";
import { MentorEndpoints, CallEndpoints, ConfigEndpoint } from "../../constants/endpoint";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import notifee from "@notifee/react-native";
import { Linking } from "react-native";
import DialogBox from "../../components/DialogBox";

const { width } = Dimensions.get("window");

if (
  Platform.OS === 'android' &&
  !(global as any).nativeFabricUIManager &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const getLevelIcon = (lvl?: string) => {
  const normLvl = lvl?.toLowerCase();
  if (normLvl === 'verified') return require("../../app-assets/level-verified.svg");
  if (normLvl === 'standard') return require("../../app-assets/level-standard.svg");
  if (normLvl === 'signature') return require("../../app-assets/level-signature.svg");
  if (normLvl === 'fellow') return require("../../app-assets/level-fellow.svg");
  return require("../../app-assets/verified-check.svg");
};

const isNumeric = (val: any) => !isNaN(Number(val)) && val !== undefined && val !== null && String(val).trim() !== "";

export default function MentorHomePage() {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    primaryButtonText?: string;
    onPrimaryPress?: () => void;
    secondaryButtonText?: string;
    onSecondaryPress?: () => void;
  }>({ title: '', message: '' });

  const getLevelRateDisplay = (levelName: string) => {
    const key = `price_${levelName}`;
    if (settings && settings[key] !== undefined && settings[key] !== null && settings[key] !== "") {
      return settings[key];
    }
    const defaults: any = {
      Verified: "7",
      Standard: "10",
      Signature: "15",
      Fellow: "20"
    };
    return defaults[levelName] || "";
  };

  const getLevelRateText = (levelName: string) => {
    const rate = getLevelRateDisplay(levelName);
    if (isNumeric(rate)) {
      return `charge up to ${rate} credits/min`;
    }
    return rate;
  };

  const toggleLevel = (levelName: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedLevel(expandedLevel === levelName ? null : levelName);
  };

  // Check for Overlay permission (Display over other apps)
  const checkOverlayPermission = async () => {
    try {
      console.log('[Overlay Check] Starting overlay permission check...');
      
      // If we are not on Android, we do not need overlay permission
      if (Platform.OS !== 'android') {
        console.log('[Overlay Check] Skipped check: Platform is not Android');
        return;
      }

      // Check if we already prompted the user
      const hasPrompted = await AsyncStorage.getItem('hasPromptedOverlay');
      console.log('[Overlay Check] hasPromptedOverlay from storage:', hasPrompted);
      
      if (!hasPrompted) {
        // Safely check power management info if needed, but wrap it
        try {
          const powerManagement = await notifee.getPowerManagerInfo();
          console.log('[Overlay Check] Power management info:', powerManagement);
        } catch (pmError) {
          console.warn('[Overlay Check] Error fetching power management info:', pmError);
        }

        console.log('[Overlay Check] Displaying "Enable Full-Screen Calls" dialog');
        setAlertData({
            title: "Enable Full-Screen Calls",
            message: "To receive incoming calls while using other apps or when your screen is locked, please enable 'Display over other apps' in your system settings.",
            primaryButtonText: "Open Settings",
            onPrimaryPress: async () => {
                console.log('[Overlay Check] User clicked Open Settings');
                await AsyncStorage.setItem('hasPromptedOverlay', 'true');
                Linking.openSettings();
            },
            secondaryButtonText: "Maybe Later",
            onSecondaryPress: async () => {
                console.log('[Overlay Check] User clicked Maybe Later');
                await AsyncStorage.setItem('hasPromptedOverlay', 'true');
            }
        });
        setAlertVisible(true);
      } else {
        console.log('[Overlay Check] Prompt already shown previously');
      }
    } catch (err) {
      console.error('[Overlay Check] Error in checkOverlayPermission:', err);
    }
  };

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
      const [statsRes, historyRes, conditionsRes, settingsRes] = await Promise.all([
        api.get(MentorEndpoints.getMeStats),
        api.get(`${CallEndpoints.getMentorSessions}?limit=3`),
        api.get(MentorEndpoints.getPromotionConditions),
        api.get(ConfigEndpoint.settings)
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

      if (settingsRes && settingsRes.status === 200) {
        setSettings(settingsRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch mentor stats/settings", err);
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
    checkOverlayPermission(); // Prompt mentor for full-screen permission
  }, []);

  useEffect(() => {
    if (data?.profile?.mentorlevel && expandedLevel === null) {
      setExpandedLevel(data.profile.mentorlevel);
    }
  }, [data]);

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
        {/* Header matching Node 539:209 */}
        <View style={styles.headerCard}>
            <Image 
                source={require("../../app-assets/header-bg-curve.svg")} 
                style={[StyleSheet.absoluteFillObject, { transform: [{ rotate: '180deg' }] }]}
                contentFit="fill"
            />

            <Image 
                source={require("../../app-assets/verified-check-badge.svg")} 
                style={styles.headerVerifiedBadge} 
            />

            <View style={styles.headerContentRow}>
                <TouchableOpacity 
                    style={styles.headerProfileSection} 
                    onPress={() => navigation.navigate("MentorProfilePage")}
                    activeOpacity={0.8}
                >
                    <Image source={getLevelIcon(profile?.mentorlevel)} style={styles.headerLevelIcon} />
                    <View style={styles.headerNameCol}>
                        <Text style={styles.headerGreetingText}>Hi {profile.user?.name?.split(" ")[0] || "Mentor"}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={styles.headerCollegeText}>{profile.iit_name || "IIT Student"}</Text>
                            <Image 
                                source={require("../../app-assets/edit-pencil-white.svg")} 
                                style={styles.headerEditIcon} 
                            />
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.headerToggleWrapper} 
                    onPress={() => toggleOnlineStatus(!isOnline)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.headerSwitchTrack, isOnline && styles.headerSwitchTrackOnline]}>
                        <View style={[styles.headerSwitchThumb, isOnline && styles.headerSwitchThumbOnline]} />
                    </View>
                    <Text style={styles.headerToggleText}>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Earning Stats matching Node 306:184 */}
        <View style={styles.statsRow}>
          <StatCard title="TODAY" amount={`${stats.today.earnings} Credits`} subtitle={`${stats.today.count} calls`} />
          <StatCard title="WEEK" amount={`${stats.week.earnings} Credits`} subtitle={`${stats.week.count} calls`} />
          <StatCard title="ALL TIME" amount={`${stats.allTime.earnings} Credits`} subtitle={`${stats.allTime.count} calls`} />
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
              <View style={[styles.iconCircle, { backgroundColor: '#0077CB' }]}>
                <Image source={require("../../app-assets/star-icon.svg")} style={styles.progressIcon} tintColor="white" />
              </View>
              <View style={styles.progressDetails}>
                <View style={styles.progressTextRow}>
                  <Text style={styles.progressSubLabel}>Rating</Text>
                  <Text style={styles.progressValue}>{Number(profile.avg_rating).toFixed(1)}/{Number(nextCond?.minRating || 0).toFixed(1)}</Text>
                </View>
                <View style={styles.barBackground}>
                   <View style={[styles.barFill, { backgroundColor: '#0077CB', width: `${Math.min(Number(profile.avg_rating) / (Number(nextCond?.minRating) || 1), 1) * 100}%` }]} />
                </View>
              </View>
            </View>

            <Text style={styles.progressHint}>
                Complete {nextCond?.minCalls} calls and maintain {Number(nextCond?.minRating).toFixed(1)}+ rating to upgrade to {nextLevel} Mentor and {getLevelRateText(nextLevel)}
            </Text>
          </View>
        )}

        {/* History Section matching Node 373:1381 */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>History</Text>
            <TouchableOpacity onPress={() => navigation.navigate("MentorMissedCalls")}>
                <Text style={styles.missedCallsLink}>Missed Calls</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.historyContainer}>
            {history.length > 0 ? (
                history.map((session) => (
                    <View key={session.id} style={styles.historyItem}>
                        <View style={styles.studentAvatar}>
                            {session.student?.photo_url ? (
                                <Image source={{ uri: session.student.photo_url }} style={styles.avatarImg} />
                            ) : (
                                <Image source={require("../../app-assets/profile-circle.svg")} style={styles.avatarImg} tintColor="#c0c0c0" />
                            )}
                        </View>
                        <View style={styles.historyInfo}>
                            <View style={styles.historyTopRow}>
                                <Text style={styles.studentName}>{session.student?.name || "Student"}</Text>
                                <Text style={styles.earningText}>{session.mentorEarning || 0} Credits</Text>
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
            <TouchableOpacity onPress={() => navigation.navigate("MentorSessionsPage")}>
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
                rate={getLevelRateDisplay("Verified")} 
                requirements={getRequirements("Verified")} 
                benefits={["Start earning immediately", "Get listed on the platform"]}
                active={profile.mentorlevel === 'Verified'} 
                isExpanded={expandedLevel === 'Verified'}
                onToggle={() => toggleLevel('Verified')}
            />
            <PlanCard 
                level="Standard" 
                rate={getLevelRateDisplay("Standard")} 
                requirements={getRequirements("Standard")} 
                benefits={[
                  isNumeric(getLevelRateDisplay("Standard")) ? `Charge up to ${getLevelRateDisplay("Standard")} credits/min` : getLevelRateDisplay("Standard"),
                  "Better ranking in search"
                ]}
                active={profile.mentorlevel === 'Standard'} 
                isExpanded={expandedLevel === 'Standard'}
                onToggle={() => toggleLevel('Standard')}
            />
            <PlanCard 
                level="Signature" 
                rate={getLevelRateDisplay("Signature")} 
                requirements={getRequirements("Signature")} 
                benefits={[
                  isNumeric(getLevelRateDisplay("Signature")) ? `Charge up to ${getLevelRateDisplay("Signature")} credits/min` : getLevelRateDisplay("Signature"),
                  "Featured in search results"
                ]}
                active={profile.mentorlevel === 'Signature'} 
                isExpanded={expandedLevel === 'Signature'}
                onToggle={() => toggleLevel('Signature')}
            />
            <PlanCard 
                level="Fellow" 
                rate={getLevelRateDisplay("Fellow")} 
                requirements={getRequirements("Fellow")} 
                benefits={["Highest earning potential", "Direct platform support"]}
                active={profile.mentorlevel === 'Fellow'} 
                isExpanded={expandedLevel === 'Fellow'}
                onToggle={() => toggleLevel('Fellow')}
            />
        </View>
      </ScrollView>
      <DialogBox
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        primaryButtonText={alertData.primaryButtonText}
        onPrimaryPress={() => {
            setAlertVisible(false);
            alertData.onPrimaryPress?.();
        }}
        secondaryButtonText={alertData.secondaryButtonText}
        onSecondaryPress={() => {
            setAlertVisible(false);
            alertData.onSecondaryPress?.();
        }}
        onClose={() => setAlertVisible(false)}
      />
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

function PlanCard({ level, rate, requirements, benefits, active, isExpanded, onToggle }: any) {
    const getPlanBorderColor = (lvl: string) => {
        if (lvl === 'Verified') return '#e0e0e0';
        if (lvl === 'Standard') return '#0077c8';
        if (lvl === 'Signature') return '#3b4b6b';
        if (lvl === 'Fellow') return '#0a192f';
        return '#0077c8';
    }

    const getPlanBgColor = (lvl: string) => {
        if (lvl === 'Verified') return '#edf5ff';
        if (lvl === 'Standard') return '#0077c8';
        if (lvl === 'Signature') return '#3b4b6b';
        if (lvl === 'Fellow') return '#0a192f';
        return '#0077c8';
    }

    const getPlanTextColor = (lvl: string) => {
        if (lvl === 'Verified') return '#0077c8';
        return 'white';
    }

    const getLevelDisplayName = (lvl: string) => {
        if (lvl === 'Signature') return 'SIGNATURE';
        if (lvl === 'Fellow') return 'FELLOW';
        return lvl.toUpperCase();
    }

    const textColor = getPlanTextColor(level);

    // Animation values
    const animValue = React.useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

    React.useEffect(() => {
        if (isExpanded) {
            animValue.setValue(0);
            Animated.timing(animValue, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [isExpanded]);

    const opacity = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-15, 0],
    });

    return (
        <View style={styles.planCardWrapper}>
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={onToggle}
                style={[styles.planBanner, { 
                    backgroundColor: 'white', 
                    borderWidth: 0.5, 
                    borderColor: getPlanBorderColor(level) 
                }]}
            >
                <Image 
                    source={require("../../app-assets/plan-card-bg.svg")} 
                    style={[
                        {
                            position: 'absolute',
                            top: 6,
                            bottom: 6,
                            left: 0,
                            right: 0,
                        },
                        { 
                            transform: [{ scaleY: -1 }],
                            tintColor: getPlanBgColor(level),
                            marginLeft: -20
                        }
                    ]} 
                    contentFit="fill"
                />

                <View style={styles.planBannerLeft}>
                    <Image source={getLevelIcon(level)} style={styles.planBannerIcon} />
                </View>
                
                 <View style={styles.planBannerMiddle}>
                     <Text style={[styles.planBannerLevel, { color: textColor }]}>
                         {getLevelDisplayName(level)}
                     </Text>
                     {isNumeric(rate) ? (
                         <>
                             <Text style={[styles.planBannerChargeLabel, { color: textColor }]}>Charge up to</Text>
                             <Text style={[styles.planBannerChargeValue, { color: textColor }]}>
                                 ₹{rate}
                                 <Text style={[styles.planBannerChargeUnit, { color: textColor }]}>/min</Text>
                             </Text>
                         </>
                     ) : (
                         <Text style={[styles.planBannerChargeValue, { color: textColor, fontSize: 13, marginTop: 4 }]}>
                             {rate}
                         </Text>
                     )}
                 </View>

                 <View style={styles.planBannerRight}>
                     {requirements.slice(0, 2).map((req: string, index: number) => (
                         <View key={index} style={styles.planBannerReqRow}>
                             <Image 
                                 source={require("../../app-assets/tick-circle.svg")} 
                                 style={styles.bannerTickIcon} 
                                 tintColor={textColor} 
                             />
                             <Text style={[styles.planBannerReqText, { color: textColor }]} numberOfLines={1}>
                                 {req}
                             </Text>
                         </View>
                     ))}
                 </View>
             </TouchableOpacity>

             {isExpanded && (
                 <Animated.View style={{ opacity, transform: [{ translateY }] }}>
                     <View style={styles.planDetailsCard}>
                         <View style={styles.planDetailsHeader}>
                             {active && (
                                 <View style={{ backgroundColor: '#25d366', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                                     <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>ACTIVE</Text>
                                 </View>
                             )}
                             <Text style={styles.planDetailsLabel}>Charge</Text>
                             <Text style={styles.planDetailsRate}>{isNumeric(rate) ? `₹${rate}/min` : rate}</Text>
                         </View>
                        
                        <View style={styles.planSection}>
                            <Text style={[styles.planSectionTitle, {color: '#0077CB'}]}>Requirements</Text>
                            {requirements.map((req: string) => (
                                <View key={req} style={styles.planRow}>
                                    <Image source={require("../../app-assets/tick-circle.svg")} style={styles.tickIcon} tintColor="#25d366" />
                                    <Text style={styles.planRowText}>{req}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.planSection}>
                            <Text style={[styles.planSectionTitle, {color: '#0077CB'}]}>Benefits</Text>
                            {benefits.map((ben: string) => (
                                <View key={ben} style={styles.planRow}>
                                    <Image source={require("../../app-assets/tick-circle.svg")} style={styles.tickIcon} tintColor="#25d366" />
                                    <Text style={styles.planRowText}>{ben}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

function formatRelativeDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    
    // Normalize both dates to midnight local time for a true calendar day comparison
    const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffMs = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1d";
    return `${diffDays}d`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 72,
    borderRadius: 9,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
    backgroundColor: 'white',
  },
  headerVerifiedBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 16,
    height: 16,
    zIndex: 10,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingLeft: 20,
    paddingRight: 16,
    justifyContent: 'space-between',
  },
  headerProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerLevelIcon: {
    width: 28,
    height: 32,
    marginRight: 10,
  },
  headerNameCol: {
    justifyContent: 'center',
  },
  headerGreetingText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  headerCollegeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    lineHeight: 14,
  },
  headerEditIcon: {
    width: 8,
    height: 8,
    tintColor: 'white',
  },
  headerToggleWrapper: {
    flexDirection: 'row',
    marginTop: -15,
    marginRight: 10,
    alignItems: 'center',
    gap: 8,
  },
  headerSwitchTrack: {
    width: 28,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  headerSwitchTrackOnline: {
    backgroundColor: '#25D366',
  },
  headerSwitchThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  headerSwitchThumbOnline: {
    alignSelf: 'flex-end',
  },
  headerToggleText: {
    fontSize: 12,
    color: '#444653',
    fontWeight: '500',
    width: 55,
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
    marginTop: 20,
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
    color: '#0077CB',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missedCallsLink: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
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
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
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
    color: '#0077CB',
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
    height: 90,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planBannerLeft: {
    width: 50,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planBannerIcon: {
    marginTop: 20,
    marginRight: '-170%',
    width: 35,
    height: 40,
  },
  planBannerMiddle: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    paddingLeft: '20%',
  },
  planBannerLevel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '300',
    marginBottom: -5,
  },
  planBannerChargeLabel: {
    color: 'white',
    fontSize: 11,
    marginBottom: -5
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
    color: '#0077CB',
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
