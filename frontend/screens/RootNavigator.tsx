import React, { useEffect, useState } from "react";
import Ionicons from "@react-native-vector-icons/ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
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
import FavoriteMentorsPage from "./student/FavoriteMentorsPage";
import StudentProfilePage from "./student/StudentProfilePage";
import StudentProfileWrapper from "./student/ProfileWrapper";
import YourSession from "./student/YourSession";
import MentorProfile from "./student/MentorProfile";
import MentorProfilePage from "./mentor/MentorProfilePage";
import MentorProfileWrapper from "./mentor/ProfileWrapper";
import MentorAskPage from "./mentor/MentorAskPage";
import ScheduleCall from "./student/ScheduleCall";
import PaymentPage from "./student/PaymentPage";
import StudentCallsPage from "./student/StudentCallsPage";
import StudentAskPage from "./student/StudentAskPage";
import QuestionDetailScreen from "./student/QuestionDetailScreen";
import ChatListPage from "./chat/ChatListPage";
import ChatPage from "./chat/ChatPage";
import MentorChatPage from "./mentor/MentorChatPage";
import MentorHomePage from "./mentor/MentorHomePage";
import MentorSessionsPage from "./mentor/MentorSessionsPage";
import MentorVerificationPendingPage from "./mentor/MentorVerificationPendingPage";
import MentorMissedCallsPage from "./mentor/MentorMissedCallsPage";
import FloatingCallBanner from "../components/FloatingCallBanner";
import CustomTabBar from "../components/CustomTabBar";
import SplashScreen from "./SplashScreen";
import api from "../services/api";
import {
  LoginEndpoints,
  MentorEndpoints,
} from "../constants/endpoint";
import { storage } from "../services/storage";
import DialogBox from "../components/DialogBox";
import { Animated, Linking, Platform } from "react-native";
import { navigationRef } from "../services/navigation";

import linking from "../linking";
import { useNotificationRouter } from "../hooks/useNotificationRouter";

import { agoraChatService } from "../services/chat/agoraChatClient";
import { chatSessionManager } from "../services/chat/chatSessionManager";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

interface ProfileInfoParams {
  full_name: string;
  email: string;
  role: string;
  phone: string;
  iit?: string;
  state: string;
}

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

function AuthenticatedTabs() {
  const { role } = useAuth();

  return (
    <Tab.Navigator
      id="authenticated-tabs"
      initialRouteName="Home"
      backBehavior="initialRoute"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={role === "mentor" ? MentorHomePage : StudentHomePage}
      />
      <Tab.Screen name="Chat" component={ChatListPage} />
      {role === "student" && (
        <Tab.Screen name="Ask" component={StudentAskPage} />
      )}
      {role === "mentor" && <Tab.Screen name="Ask" component={MentorAskPage} />}
      {role === "student" && <Tab.Screen name="Profile" component={StudentProfileWrapper} />}
      {role === "mentor" && <Tab.Screen name="Profile" component={MentorProfileWrapper} />}
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { isSignedIn, setIsSignedIn, setRole, role, mentorlevel, requestNotificationPermissions } = useAuth();
  const [profileData, setProfileData] = useState<ProfileInfoParams>({
    full_name: "",
    email: "",
    role: "",
    phone: "",
    state: "",
  });
  const [initialScreen, setInitialScreen] = useState<string | null>(null);
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    primaryButtonText?: string;
    onPrimaryPress?: () => void;
    secondaryButtonText?: string;
    onSecondaryPress?: () => void;
  }>({ title: "", message: "" });
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  const setupUncompletedProfile = async (user: any) => {
    setProfileData({
      full_name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      state: "loaded",
    });
    if (user.role === "mentor") {
      try {
        const iit = await api.post(LoginEndpoints.getIIT, {
          email: user.email,
        });
        if (iit.status === 200) {
          setProfileData((prev) => ({ ...prev, iit: iit.data?.name_of_iit }));
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

  const requestFullScreenIntentAccess = async () => {
    if (Platform.OS !== "android") return;
    const hasPrompted = await storage.getItem("hasPromptedFullScreenIntent");
    if (hasPrompted) return;

    setAlertData({
      title: "Enable Full-Screen Calls",
      message:
        "To see incoming calls over the lock screen like a normal phone call, please allow Mentivo to display full-screen notifications in your system settings.",
      primaryButtonText: "Open Settings",
      onPrimaryPress: async () => {
        setAlertVisible(false);
        await storage.setItem("hasPromptedFullScreenIntent", "true");
        Linking.sendIntent("android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT");
      },
      secondaryButtonText: "Maybe Later",
      onSecondaryPress: async () => {
        setAlertVisible(false);
        await storage.setItem("hasPromptedFullScreenIntent", "true");
      },
    });
    setAlertVisible(true);
  };

  const setupCompletedProfile = async (user: any) => {
    await storage.setItem("role", user.role);
    setRole(user.role);
    setIsSignedIn(true);
    setInitialScreen("");
    requestNotificationPermissions();
    requestFullScreenIntentAccess();
  };

  useNotificationRouter(isSignedIn);

  useEffect(() => {
    const getInitialScreen = async () => {
      const accessToken = await storage.getItem("accessToken");
      if (!accessToken) {
        setInitialScreen("Landing");
        return;
      }
      try {
        const response = await api.get(LoginEndpoints.whoAmI, {});
        if (
          response.status === 200 &&
          response.data?.user?.isEmailVerified === true
        ) {
          await storage.setItem("verifiedEmail", "true");
          const user = response.data?.user;
          console.log("user information ", user);

          if (user.profile_completed === false) {
            await setupUncompletedProfile(user);
          } else {
            await setupCompletedProfile(user);
          }
        } else {
          await storage.multiRemove([
            "accessToken",
            "refreshToken",
            "user",
            "verifiedEmail",
          ]);
          setInitialScreen("Landing");
        }
      } catch (err) {
        console.warn("Failed to fetch user profile on cold start (using cached session):", err);
        const userJson = await storage.getItem("user");
        if (userJson) {
          try {
            const user = JSON.parse(userJson);
            if (user.profile_completed === false) {
              await setupUncompletedProfile(user);
            } else {
              await setupCompletedProfile(user);
            }
            return;
          } catch (parseErr) {
            console.error("Failed to parse cached user:", parseErr);
          }
        }

        await storage.multiRemove([
          "accessToken",
          "refreshToken",
          "user",
          "verifiedEmail",
        ]);
        setInitialScreen("Landing");
      }
    };
    getInitialScreen();
  }, []);

  if (initialScreen === null) {
    return <SplashScreen />;
  }

  return (
    <>
      <NavigationContainer ref={navigationRef} linking={linking}>
        {isSignedIn ? (
          <AuthStack.Navigator
            id="auth-stack"
            screenOptions={{
              headerShown: false,
              ...TransitionPresets.SlideFromRightIOS,
            }}
          >
            <AuthStack.Screen
              name="Main"
              component={
                role === "mentor" && mentorlevel === null
                  ? MentorVerificationPendingPage
                  : AuthenticatedTabs
              }
            />
            <AuthStack.Screen
              name="StudentProfilePage"
              component={StudentProfilePage}
            />
            <AuthStack.Screen
              name="FavoriteMentors"
              component={FavoriteMentorsPage}
            />
            <AuthStack.Screen name="YourSession" component={YourSession} />
            <AuthStack.Screen name="MentorProfile" component={MentorProfile} />
            <AuthStack.Screen
              name="MentorProfilePage"
              component={MentorProfilePage}
            />
            <AuthStack.Screen name="ScheduleCall" component={ScheduleCall} />
            <AuthStack.Screen name="Payment" component={PaymentPage} />
            <AuthStack.Screen
              name="IncomingCall"
              component={IncomingCallScreen}
            />
            <AuthStack.Screen name="InCall" component={InCallScreen} />
            <AuthStack.Screen name="RatingScreen" component={RatingScreen} />
            <AuthStack.Screen
              name="MentorSessionsPage"
              component={MentorSessionsPage}
            />
            <AuthStack.Screen name="ChatPage" component={ChatPage} />
            <AuthStack.Screen
              name="MentorChatPage"
              component={MentorChatPage}
            />
            <AuthStack.Screen
              name="StudentCallsPage"
              component={StudentCallsPage}
            />
            <AuthStack.Screen
              name="QuestionDetail"
              component={QuestionDetailScreen}
            />
            <AuthStack.Screen
              name="MentorMissedCalls"
              component={MentorMissedCallsPage}
            />
          </AuthStack.Navigator>
        ) : (
          <Stack.Navigator
            id="unauth-stack"
            screenOptions={{
              headerShown: false,
              ...TransitionPresets.SlideFromRightIOS,
            }}
            initialRouteName={initialScreen}
          >
            <Stack.Screen name="Landing" component={LandingPage} />
            <Stack.Screen name="RoleSelection" component={RoleSelection} />
            <Stack.Screen name="StudentLogin" component={StudentLoginPage} />
            <Stack.Screen name="StudentSignUp" component={StudentSignupPage} />
            <Stack.Screen name="MentorLogin" component={MentorLoginPage} />
            <Stack.Screen name="MentorSignUp" component={MentorSignupPage} />
            <Stack.Screen
              name="CompleteProfile"
              component={CompleteProfile}
              initialParams={
                initialScreen === "CompleteProfile" ? profileData : null
              }
            />
            <Stack.Screen name="SendOtp" component={SendOtpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} />
          </Stack.Navigator>
        )}
        <DialogBox
          title={alertData.title}
          message={alertData.message}
          primaryButtonText={alertData.primaryButtonText}
          onPrimaryPress={alertData.onPrimaryPress}
          secondaryButtonText={alertData.secondaryButtonText}
          onSecondaryPress={alertData.onSecondaryPress}
          onClose={() => setAlertVisible(false)}
          visible={alertVisible}
        />
      </NavigationContainer>
      <FloatingCallBanner />
    </>
  );
}