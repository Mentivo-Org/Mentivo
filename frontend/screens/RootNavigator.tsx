import React, { useEffect, useState, useRef } from "react";
import Ionicons from "@react-native-vector-icons/ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";

import { useAuth } from "../services/retrieveKeys";

import LandingPage from "./LandingPage";
import RoleSelection from "./RoleSelection";
import StudentLoginPage from "./student/StudentLoginPage";
import StudentSignupPage from "./student/StudentSignupPage";
import MentorLoginPage from "./mentor/MentorLoginPage";
import MentorSignupPage from "./mentor/MentorSignupPage";
import CompleteProfile from "./CompleteProfile";
import SendOtpScreen from "./SendOtp";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import IncomingCallScreen from "./IncomingCallScreen";
import InCallScreen from "./InCallScreen";
import RatingScreen from "./student/RatingScreen";

import StudentHomePage from "./student/StudentHomePage";
import StudentProfilePage from "./student/StudentProfilePage";
import YourSession from "./student/YourSession";
import MentorProfile from "./student/MentorProfile";
import MentorProfilePage from "./mentor/MentorProfilePage";
import MentorAskPage from "./mentor/MentorAskPage";
import ScheduleCall from "./student/ScheduleCall";
import PaymentPage from "./student/PaymentPage";
import StudentCallsPage from "./student/StudentCallsPage";
import StudentAskPage from "./student/StudentAskPage";
import ChatListPage from "./chat/ChatListPage";
import ChatPage from "./chat/ChatPage";
import MentorChatListPage from "./mentor/MentorChatListPage";
import MentorChatPage from "./mentor/MentorChatPage";
import MentorHomePage from "./mentor/MentorHomePage";
import MentorSessionsPage from "./mentor/MentorSessionsPage";
import SplashScreen from "./SplashScreen";
import api from "../services/api";
import { LoginEndpoints, MentorEndpoints } from "../constants/endpoint";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DialogBox from "../components/DialogBox";
import { Image } from "expo-image";
import { StyleSheet, View, TouchableOpacity, Animated, AppState } from "react-native";
import notifee, { EventType, AndroidImportance } from "@notifee/react-native";
import { getMessaging, onMessage } from "@react-native-firebase/messaging";
import { navigationRef, navigate, getActiveChatSessionId } from "../services/navigation";

import linking from "../linking";
import { socketManager } from "../services/socketManager";

import { agoraChatService } from "../services/chat/agoraChatClient";
import { chatSessionManager } from "../services/chat/chatSessionManager";

const INCOMING_CALL_CHANNEL = 'incoming_calls';
const ONGOING_CALL_CHANNEL = 'ongoing_calls';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

interface ProfileInfoParams {
  full_name: string,
  email: string,
  role: string,
  phone: string,
  iit?: string,
  state: string
}

function TabItem({ route, isFocused, onPress }: any) {
  const animatedValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [isFocused]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", "#f5f5f5f5"],
  });

  const iconContainerBackground = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", "white"],
  });

  const iconColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ffffff", "#2563eb"],
  });

  let icon;
  if (route.name === "Home") {
    icon = require("../app-assets/mentoring-icon.svg");
  } else if (route.name === "Chat") {
    icon = require("../app-assets/chat-round.svg");
  } else if (route.name === "Ask") {
    icon = require("../app-assets/chat-round.svg");
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      style={tabStyles.tabItem}
    >
      <Animated.View
        style={[
          tabStyles.animatedWrapper,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <Animated.View
          style={[
            tabStyles.activeCircle,
            {
              backgroundColor: backgroundColor,
            },
          ]}
        />
        <Animated.View
          style={[
            tabStyles.iconContainer,
            {
              backgroundColor: iconContainerBackground,
              // Shadow animation is tricky with native driver false on some platforms, 
              // but we can control elevation/opacity if needed.
              elevation: isFocused ? 4 : 0,
              shadowOpacity: isFocused ? 0.25 : 0,
            },
          ]}
        >
          {route.name === "Ask" ? (
            <AnimatedIonicons
              name={isFocused ? "add-circle" : "add-circle-outline"}
              size={26}
              style={{ color: iconColor }}
            />
          ) : (
            <AnimatedImage
              source={icon}
              style={tabStyles.icon}
              tintColor={isFocused ? "#2563eb" : "#ffffff"}
            />
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);
const AnimatedImage = Animated.createAnimatedComponent(Image);

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={tabStyles.container}>
      <View style={tabStyles.pill}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.name}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

function AuthenticatedTabs() {
  const { role } = useAuth();
  
  return (
    <Tab.Navigator
      id="authenticated-tabs"
      initialRouteName="Home"
      backBehavior="initialRoute"
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={role === "mentor" ? MentorHomePage : StudentHomePage}
      />
      <Tab.Screen
        name="Chat"
        component={ChatListPage}
      />
      {role === "student" && (
        <Tab.Screen
          name="Ask"
          component={StudentAskPage}
        />
      )}
      {role === "mentor" && (
        <Tab.Screen
          name="Ask"
          component={MentorAskPage}
        />
      )}
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { isSignedIn, setIsSignedIn, setRole, role } = useAuth();
  const [profileData, setProfileData] = useState<ProfileInfoParams>({full_name: '',email: '',role: '',phone: '', state: ''});
  const [initialScreen, setInitialScreen] = useState<string | null>(null);
  const [alertData, setAlertData] = useState({ title: "", message: "" });
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  const prefetchMentorStats = async () => {
    try {
      const statsRes = await api.get(MentorEndpoints.getMeStats);
      if (statsRes.status === 200) {
        await AsyncStorage.setItem('stats', JSON.stringify(statsRes.data));
      }
    } catch (statsErr) {
      console.error("Failed to prefetch mentor stats:", statsErr);
    }
  };

  const setupUncompletedProfile = async (user: any) => {
    setProfileData({
      full_name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      state: 'loaded'
    });
    if (user.role === "mentor") {
      try {
        const iit = await api.post(LoginEndpoints.getIIT, { email: user.email });
        if (iit.status === 200) {
          setProfileData((prev) => ({...prev, iit: iit.data?.name_of_iit}));
        } else {
          setAlertData({
            title: "Could not fetch IIT name",
            message: iit.data?.error || "Unknown error",
          });
          setAlertVisible(true);
        }
      } catch (err: any) {
        setAlertData({
          title: "Could not fetch IIT name",
          message: err.message || "Network error",
        });
        setAlertVisible(true);
      }
    }
    setInitialScreen("CompleteProfile");
  };

  const setupCompletedProfile = async (user: any) => {
    await AsyncStorage.setItem('role', user.role);
    setRole(user.role);
    setIsSignedIn(true);
    setInitialScreen('');
  };
  
  useEffect(() => {
    if (!isSignedIn) return;

    // 1. Create notifee channels
    const createChannels = async () => {
      await notifee.createChannel({
        id: INCOMING_CALL_CHANNEL,
        name: 'Incoming Calls',
        importance: AndroidImportance.HIGH,
        vibration: true,
        vibrationPattern: [300, 100, 300, 100, 300],
        sound: 'default',
        fullScreenIntent: true,
      });

      await notifee.createChannel({
        id: ONGOING_CALL_CHANNEL,
        name: 'Ongoing Calls',
        importance: AndroidImportance.LOW,
        vibration: false,
        sound: null,
        ongoing: true,
        onlyAlertOnce: true,
      });
    };
    createChannels();

    // Initialize Agora Chat
    const initAgoraChat = async () => {
      try {
        console.log('[Agora Chat] Starting initialization...');
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          console.log('[Agora Chat] Fetching token for user:', user.id);
          const data = await chatSessionManager.getChatToken();
          
          if (!data || !data.token || !data.userId) {
            console.error('[Agora Chat] Invalid token response:', data);
            return;
          }

          const { token, userId: agoraUserId } = data;
          console.log('[Agora Chat] Logging in with Agora ID:', agoraUserId);
          await agoraChatService.login(agoraUserId, token);
          console.log('[Agora Chat] Logged in successfully');
        } else {
          console.warn('[Agora Chat] No user data found in storage');
        }
      } catch (e) {
        console.error('[Agora Chat] Initialization/Login failed:', e);
      }
    };
    initAgoraChat();

    // 2. Foreground notification press
    const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const data = detail.notification?.data || detail.data || {};
        const { callId, channelName, callerName, callerPhoto, type: notificationType, sessionId, senderId, senderName } = data;
        if (callId) {
          navigate('IncomingCall', { callId, channelName, callerName, callerPhoto });
        } else if (notificationType === 'chat' || sessionId) {
          navigate('ChatPage', {
            partnerId: senderId,
            partnerName: senderName,
            sessionId: sessionId,
          });
        }
      }
    });

    // Foreground FCM handler: show a notifee heads-up notification when a chat
    // message arrives while the app is open (FCM suppresses its own UI in foreground).
    const messaging = getMessaging();
    const unsubscribeFcmForeground = onMessage(messaging, async (remoteMessage) => {
      if (remoteMessage.data?.type === 'chat') {
        const { sessionId, senderId, senderName, title, body } = remoteMessage.data as any;
        // Don't show a notification if the user is already viewing this chat
        if (getActiveChatSessionId() === sessionId) return;
        await notifee.displayNotification({
          id: `chat_${sessionId}_${Date.now()}`,
          title: title || senderName || 'New Message',
          body: body || 'You have a new message',
          data: { type: 'chat', sessionId, senderId, senderName },
          android: {
            channelId: 'messages',
            importance: AndroidImportance.HIGH,
            pressAction: { id: 'default', launchActivity: 'default' },
            asForegroundService: false,
          },
        });
      }
    });

    // 3. Cold start - app opened from killed state
    const checkInitialNotification = async () => {
      const initialNotification = await notifee.getInitialNotification();
      const data = initialNotification?.notification?.data || initialNotification?.data || {};
      const { callId, channelName, callerName, callerPhoto, type: notificationType, sessionId, senderId, senderName } = data;
      if (callId) {
        navigate('IncomingCall', { callId, channelName, callerName, callerPhoto });
      } else if (notificationType === 'chat' || sessionId) {
        navigate('ChatPage', {
          partnerId: senderId,
          partnerName: senderName,
          sessionId: sessionId,
        });
      }

      // Also check pending call from background press
      const pendingCallData = await AsyncStorage.getItem('pendingCallData');
      if (pendingCallData) {
        await AsyncStorage.removeItem('pendingCallData');
        const { callId: pCallId, channelName: pChannelName, callerName: pCallerName, callerPhoto: pCallerPhoto } = JSON.parse(pendingCallData);
        navigate('InCall', { callId: pCallId, channelName: pChannelName, callerName: pCallerName, role: 'callee', mentorPhoto: pCallerPhoto });
      }
    };
    checkInitialNotification();

    // 3.5 AppState change handler for warm start calls
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        const pendingCallData = await AsyncStorage.getItem('pendingCallData');
        if (pendingCallData) {
          await AsyncStorage.removeItem('pendingCallData');
          const { callId, channelName, callerName, callerPhoto } = JSON.parse(pendingCallData);
          console.log('[AppState] Resuming with pending call:', callId);
          navigate('InCall', { callId, channelName, callerName, role: 'callee', mentorPhoto: callerPhoto });
        }
      }
    };
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // 4. Socket handler - wait for connection
    const setupSocketHandler = async () => {
      const waitForSocket = () => new Promise<void>(resolve => {
        if (socketManager.isConnected()) return resolve();
        let attempts = 0;
        const check = setInterval(() => {
          attempts++;
          if (socketManager.isConnected() || attempts > 25) {
            clearInterval(check);
            resolve();
          }
        }, 200);
      });

      await waitForSocket();

      const socketHandler = (data: any) => {
        if (AppState.currentState === 'active') {
          const { callId, channelName, callerName, callerPhoto } = data;
          console.log('[Socket] Incoming call received in foreground:', callId);
          navigate('IncomingCall', { callId, channelName, callerName, callerPhoto });
        } else {
          console.log('[Socket] App background - FCM will handle');
        }
      };

      // Global handler to cancel notification when call ends (for foreground app with notification in shade)
      const globalStatusHandler = (data: any) => {
        if (data.status === 'completed' || data.status === 'rejected' || data.status === 'missed') {
          console.log('[Socket] Global: Call ended, cancelling notification:', data.callId);
          notifee.cancelNotification(data.callId).catch(err => console.error('Failed to cancel notification:', err));
        }
      };

      socketManager.on('incoming_call', socketHandler);
      socketManager.on('call_status_changed', globalStatusHandler);
      return () => {
        socketManager.off('incoming_call', socketHandler);
        socketManager.off('call_status_changed', globalStatusHandler);
      };
    };

    let socketCleanup: (() => void) | undefined;
    setupSocketHandler().then(cleanup => { socketCleanup = cleanup; });

    return () => {
      unsubscribeForeground();
      unsubscribeFcmForeground();
      appStateSubscription.remove();
      if (socketCleanup) socketCleanup();
    };
  }, [isSignedIn]);

  useEffect (() => {

    const getInitialScreen = async () => {
      const accessToken = await AsyncStorage.getItem("accessToken");
      if (!accessToken) {
        setInitialScreen("Landing");
        return;
      }
      try {
        const response = await api.get(LoginEndpoints.whoAmI, {});
        if (response.status === 200 && response.data?.user?.isEmailVerified === true) {
          await AsyncStorage.setItem('verifiedEmail', 'true');
          const user = response.data?.user;
          console.log("user information ", user);
          
          if (user.role === "mentor") {
            await prefetchMentorStats();
          }

          if (user.profile_completed === false) {
            await setupUncompletedProfile(user);
          } else {
            await setupCompletedProfile(user);
          }
        } else {
          await AsyncStorage.multiRemove(["accessToken","refreshToken","user","verifiedEmail"]);
          setInitialScreen("Landing");
        }
      } catch (err) {
        setAlertData({
          title: "Error in fetching user profile information",
          message: err as string,
        });
        setAlertVisible(true);
        await AsyncStorage.multiRemove(["accessToken","refreshToken","user","verifiedEmail"]);
        setInitialScreen("Landing");
      }
    };
    getInitialScreen();
  },[])

  if(initialScreen===null) {
    return (
      <SplashScreen/>
    )
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isSignedIn ? (
        <AuthStack.Navigator
          id="auth-stack"
          screenOptions={{
            headerShown: false,
            ...TransitionPresets.SlideFromRightIOS,
          }}
        >
          <AuthStack.Screen name="Main" component={AuthenticatedTabs} />
          <AuthStack.Screen name="StudentProfilePage" component={StudentProfilePage} />
          <AuthStack.Screen name="YourSession" component={YourSession} />
          <AuthStack.Screen name="MentorProfile" component={MentorProfile} />
          <AuthStack.Screen name="MentorProfilePage" component={MentorProfilePage} />
          <AuthStack.Screen name="ScheduleCall" component={ScheduleCall} />
          <AuthStack.Screen name="Payment" component={PaymentPage} />
          <AuthStack.Screen name="IncomingCall" component={IncomingCallScreen} />
          <AuthStack.Screen name="InCall" component={InCallScreen} />
          <AuthStack.Screen name="RatingScreen" component={RatingScreen} />
          <AuthStack.Screen name="MentorSessionsPage" component={MentorSessionsPage} />
          <AuthStack.Screen name="ChatPage" component={ChatPage} />
          <AuthStack.Screen name="MentorChatListPage" component={MentorChatListPage} />
          <AuthStack.Screen name="MentorChatPage" component={MentorChatPage} />
          <AuthStack.Screen name="StudentCallsPage" component={StudentCallsPage} />
        </AuthStack.Navigator>
      ) : (
        <Stack.Navigator
          id="unauth-stack"
          screenOptions={{
            headerShown: false,
            ...TransitionPresets.SlideFromRightIOS,
          }}
          initialRouteName={initialScreen}
          linking={linking}
        >
          <Stack.Screen name="Landing" component={LandingPage} />
          <Stack.Screen name="RoleSelection" component={RoleSelection} />
          <Stack.Screen name="StudentLogin" component={StudentLoginPage} />
          <Stack.Screen name="StudentSignUp" component={StudentSignupPage} />
          <Stack.Screen name="MentorLogin" component={MentorLoginPage} />
          <Stack.Screen name="MentorSignUp" component={MentorSignupPage} />
          <Stack.Screen name="CompleteProfile" component={CompleteProfile} initialParams={(initialScreen==="CompleteProfile")?profileData:null}/>
          <Stack.Screen name="SendOtp" component={SendOtpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} />
        </Stack.Navigator>
      )}
      <DialogBox
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertVisible(false)}
        visible={alertVisible}
      />
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "transparent",
    elevation: 0,
  },
  pill: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
    width: "55%",
    height: "90%",
    borderRadius: 43,
    justifyContent: "space-evenly",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
  },
  animatedWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 60,
  },
  activeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: "absolute",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 2,
  },
  icon: {
    width: 26,
    height: 26,
  },
});
