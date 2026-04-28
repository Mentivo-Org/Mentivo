import "./global.css";
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

import LandingPage from './src/screens/LandingPage';
import FindAMentor from './src/screens/FindAMentor';
import BookYourSession from './src/screens/BookYourSession';
import MentorDashboard from './src/screens/MentorDashboard';
import SessionChat from './src/screens/SessionChat';
import AudioCall from './src/screens/AudioCall';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#00288e' }}>
      <Tab.Screen name="Home" component={LandingPage} options={{ title: 'Home' }} />
      <Tab.Screen name="FindAMentor" component={FindAMentor} options={{ title: 'Discovery' }} />
      <Tab.Screen name="MentorDashboard" component={MentorDashboard} options={{ title: 'Mentor' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="BookYourSession" component={BookYourSession} />
        <Stack.Screen name="SessionChat" component={SessionChat} />
        <Stack.Screen name="AudioCall" component={AudioCall} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
