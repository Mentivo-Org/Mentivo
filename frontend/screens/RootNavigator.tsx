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
import MentorHomePage from "./mentor/MentorHomePage";
import SplashScreen from "./SplashScreen";
import api from "../services/api";
import { LoginEndpoints } from "../constants/endpoint";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DialogBox from "../components/DialogBox";

import linking from "../linking";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

interface ProfileInfoParams {
  full_name: string,
  email: string,
  role: string,
  phone: string,
  iit?: string,
  state: string
}

export default function RootNavigator() {
  const { isSignedIn } = useAuth();
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
              setInitialScreen("Landing"); // Profile already completed, TabNavigator will take over if isSignedIn is true
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
          message: err,
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
        <Tab.Navigator
          initialRouteName="Home"
          backBehavior="initialRoute"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tab.Screen
            name="Captured"
            component={StudentHomePage}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons
                  name="checkmark-circle"
                  size={size + 5}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Home"
            component={MentorHomePage}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home" size={size + 5} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      ) : (
        <Stack.Navigator
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