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

import StudentHomePage from "./student/StudentHomePage";
import YourSession from "./student/YourSession";
import MentorProfile from "./student/MentorProfile";
import ScheduleCall from "./student/ScheduleCall";
import PaymentPage from "./student/PaymentPage";
import StudentChatPage from "./student/StudentChatPage";
import StudentAskPage from "./student/StudentAskPage";
import MentorHomePage from "./mentor/MentorHomePage";
import SplashScreen from "./SplashScreen";
import api from "../services/api";
import { LoginEndpoints } from "../constants/endpoint";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DialogBox from "../components/DialogBox";
import { Image } from "expo-image";
import { StyleSheet, View, TouchableOpacity, Animated } from "react-native";

import linking from "../linking";

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
        component={StudentHomePage}
      />
      <Tab.Screen
        name="Chat"
        component={StudentChatPage}
      />
      <Tab.Screen
        name="Ask"
        component={StudentAskPage}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { isSignedIn, setIsSignedIn } = useAuth();
  const [profileData, setProfileData] = useState<ProfileInfoParams>({full_name: '',email: '',role: '',phone: '', state: ''});
  const [initialScreen, setInitialScreen] = useState<string | null>(null);
  const [alertData, setAlertData] = useState({ title: "", message: "" });
  const [alertVisible, setAlertVisible] = useState<boolean>(false);
  
  
  useEffect (() => {

    const getInitialScreen = async () => {
      const accessToken = await AsyncStorage.getItem("accessToken");
      if (!accessToken) {
        setInitialScreen("Landing");
        return;
      }
      // showLoading("Fetching profile information for server...");
      try {
        const response = await api.get(LoginEndpoints.whoAmI, {});
        if (response.status === 200) {
          if (response.data?.user?.isEmailVerified === true) {
            await AsyncStorage.setItem('verifiedEmail', 'true');
            if (response.data?.user?.profile_completed === false) {
              const user = response.data?.user;
              console.log("user information ", user);
              setProfileData({full_name: user.name,email: user.email,role: user.role,phone: user.phone, state: 'loaded'});
              if (user.role === "mentor") {
                const iit = await api.post(LoginEndpoints.getIIT, { email: user.email });
                if (iit.status === 200) {
                  setProfileData((prev) => ({...prev, iit: iit.data?.name_of_iit}));
                } else {
                  setAlertData({title: "Could not fetch IIT name",message: iit.data?.error,});
                  setAlertVisible(true);
                }
              }
              setInitialScreen("CompleteProfile");
              return;
            } else {
              setIsSignedIn(true);
              setInitialScreen('');
              // setInitialScreen("Landing"); // Profile already completed, TabNavigator will take over if isSignedIn is true
            }
          } else {
            await AsyncStorage.multiRemove(["accessToken","refreshToken","user","verifiedEmail"]);
            setInitialScreen("Landing");
          }
        }
        else {
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
    <NavigationContainer>
      {isSignedIn ? (
        <AuthStack.Navigator
          id="auth-stack"
          screenOptions={{
            headerShown: false,
            ...TransitionPresets.SlideFromRightIOS,
          }}
        >
          <AuthStack.Screen name="Main" component={AuthenticatedTabs} />
          <AuthStack.Screen name="YourSession" component={YourSession} />
          <AuthStack.Screen name="MentorProfile" component={MentorProfile} />
          <AuthStack.Screen name="ScheduleCall" component={ScheduleCall} />
          <AuthStack.Screen name="Payment" component={PaymentPage} />
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
