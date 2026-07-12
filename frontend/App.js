import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './services/retrieveKeys';
import { LoadingProvider } from './context/LoadingContext';
import { CallProvider } from './context/CallContext';
import { VersionProvider } from './context/VersionContext';
import RootNavigator from './screens/RootNavigator';
import { StatusBar } from 'expo-status-bar';


import { SettingsProvider } from './context/SettingsContext';

export default function App() {
  
  return (
    <SafeAreaProvider>
      <VersionProvider>
        <SettingsProvider>
          <LoadingProvider>
            <AuthProvider>
              <CallProvider>
                <StatusBar style='dark'/>
                <RootNavigator/>
              </CallProvider>
            </AuthProvider>
          </LoadingProvider>
        </SettingsProvider>
      </VersionProvider>
    </SafeAreaProvider>
  );
}

