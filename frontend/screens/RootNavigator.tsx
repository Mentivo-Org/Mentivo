import React from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";

import { useAuth } from "../services/retrieveKeys";

import LandingPage from "./LandingPage";
import StudentLoginPage from "./student/StudentLoginPage";


import StudentHomePage from "./student/StudentHomePage";
import MentorHomePage from "./mentor/MentorHomePage";
import CompleteProfile from "./CompleteProfile";
import StudentSignupPage from "./student/StudentSignupPage";
import SendOtpScreen from "./SendOtp";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function RootNavigator() {
  const { isSignedIn } = useAuth();

    if(isSignedIn == null ) {
        return (
            <ActivityIndicator/>
        )
    }

  return (
    <SafeAreaProvider>
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
          <Stack.Navigator screenOptions={{
            headerShown: false,
          }}>
            <Stack.Screen name="Landing" component={LandingPage} />
            <Stack.Screen name="StudentLogin" component={StudentLoginPage} />
            <Stack.Screen name="StudentSignUp" component={StudentSignupPage} />
            <Stack.Screen name="CompleteProfile" component={CompleteProfile} />
            <Stack.Screen name="SendOtp" component={SendOtpScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
