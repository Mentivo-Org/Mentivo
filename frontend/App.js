import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './services/retrieveKeys';
import RootNavigator from './screens/RootNavigator';
import { StatusBar } from 'expo-status-bar';


export default function App() {
  <StatusBar style='dark'/>

  return (
    <SafeAreaProvider>
    <AuthProvider>
      <RootNavigator/>
    </AuthProvider>
    </SafeAreaProvider>
  );
}
