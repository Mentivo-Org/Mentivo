import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './services/retrieveKeys';
import { LoadingProvider } from './context/LoadingContext';
import RootNavigator from './screens/RootNavigator';
import { StatusBar } from 'expo-status-bar';


export default function App() {
  
  return (
    <SafeAreaProvider>
    <AuthProvider>
      <LoadingProvider>
        <StatusBar style='dark'/>
        <RootNavigator/>
      </LoadingProvider>
    </AuthProvider>
    </SafeAreaProvider>
  );
}
