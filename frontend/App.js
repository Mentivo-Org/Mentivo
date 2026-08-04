import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './services/retrieveKeys';
import { LoadingProvider } from './context/LoadingContext';
import { CallProvider } from './context/CallContext';
import { VersionProvider } from './context/VersionContext';
import RootNavigator from './screens/RootNavigator';
import { StatusBar } from 'expo-status-bar';
import { captureReferralCode } from './services/referral';


import { SettingsProvider } from './context/SettingsContext';

export default function App() {

  // Capture the referral code as early as possible, so it survives an app open in
  // which the user never reaches the signup screen. Must stay inside the component
  // rather than at module scope: Android reloads this bundle to run the FCM
  // background handler, and the clipboard is only readable by the focused app.
  useEffect(() => {
    captureReferralCode().catch((err) =>
      console.error('[Referral] Capture failed on launch:', err)
    );
  }, []);

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

