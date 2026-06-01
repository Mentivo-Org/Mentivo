import React, { useEffect, useState } from "react";
import Ionicons from "@react-native-vector-icons/ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
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
import { StyleSheet, View, TouchableOpacity } from "react-native";

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

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={tabStyles.container}>
      <View style={tabStyles.pill}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let icon;
          if (route.name === "Home") {
            icon = require("../app-assets/mentoring-icon.svg");
          } else if (route.name === "Chat") {
            icon = require("../app-assets/chat-round.svg");
          } else if (route.name === "Ask") {
            // Re-using chat round for now or circle plus if available
            icon = require("../app-assets/chat-round.svg"); 
          }

          return (
            <TouchableOpacity
              key={route.name}
              onPress={onPress}
              activeOpacity={1}
              style={tabStyles.tabItem}
            >
              {isFocused ? (
                <View style={tabStyles.activeIndicatorContainer}>
                  <View style={tabStyles.activeCircle} />
                  <View style={tabStyles.activeIconBox}>
                    {route.name === "Ask" ? (
                      <Ionicons name="add-circle" size={26} color="#2563eb" />
                    ) : (
                      <Image
                        source={icon}
                        style={tabStyles.activeIcon}
                        tintColor="#2563eb"
                      />
                    )}
                  </View>
                </View>
              ) : (
                <View style={tabStyles.inactiveIconWrapper}>
                  {route.name === "Ask" ? (
                    <Ionicons name="add-circle-outline" size={26} color="white" />
                  ) : (
                    <Image
                      source={icon}
                      style={tabStyles.inactiveIcon}
                      tintColor="white"
                    />
                  )}
                </View>
              )}
            </TouchableOpacity>
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
        <AuthStack.Navigator id="auth-stack" screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Main" component={AuthenticatedTabs} />
          <AuthStack.Screen name="YourSession" component={YourSession} />
          <AuthStack.Screen name="MentorProfile" component={MentorProfile} />
          <AuthStack.Screen name="Payment" component={PaymentPage} />
        </AuthStack.Navigator>
      ) : (
        <Stack.Navigator
          id="unauth-stack"
          screenOptions={{
            headerShown: false,
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
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    elevation: 0,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    width: '55%',
    height: '90%',
    borderRadius: 43,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  activeIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -12, // Significant jump up from the center of the pill
  },
  activeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    // backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#f5f5f5f5', 
    position: 'absolute',
  },
  activeIconBox: {
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  activeIcon: {
    width: 26,
    height: 26,
  },
  inactiveIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIcon: {
    width: 26,
    height: 26,
  }
});
