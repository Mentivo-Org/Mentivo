import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './services/retrieveKeys';
import { LoadingProvider } from './context/LoadingContext';
import RootNavigator from './screens/RootNavigator';
import { StatusBar } from 'expo-status-bar';


export default function App() {
  
  return (
    <SafeAreaProvider>
      <LoadingProvider>
        <AuthProvider>
          <StatusBar style='dark'/>
          <RootNavigator/>
        </AuthProvider>
      </LoadingProvider>
    </SafeAreaProvider>
  );
}
