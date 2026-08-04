import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { playStoreUrl, VersionEndpoint } from '../constants/endpoint';
import api from '../services/api';
import DialogBox from '../components/DialogBox';

interface VersionContextType {
  apiVersion: string;
}

const VersionContext = createContext<VersionContextType>({ apiVersion: 'v1' });

export const useVersion = () => useContext(VersionContext);

// Simple comparison: removes dots and compares as integers (e.g. 1.0.5 -> 105)
const parseVersion = (v: string) => {

  return parseInt(v.replace(/\./g, ''), 10);
};

export const VersionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiVersion, setApiVersion] = useState<string>('v1');
  const [isReady, setIsReady] = useState(false);
  
  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogType, setDialogType] = useState<'force' | 'soft' | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const { data } = await api.get(VersionEndpoint.check);
        const currentVersionStr = Constants.expoConfig?.version || '1.0.0';
        
        const current = parseVersion(currentVersionStr);
        const minV1 = parseVersion(data.min_v1);
        const minV2 = parseVersion(data.min_v2);

        let resolvedVersion = 'v1';

        if (current < minV1) {
          // Force Update
          setDialogType('force');
          setDialogVisible(true);
          // Block initialization, don't set isReady=true
          return; 
        } else if (current < minV2 && current >= minV1) {
          // Soft Update
          resolvedVersion = 'v1';
          setDialogType('soft');
          setDialogVisible(true);
        } else {
          // Latest
          resolvedVersion = 'v2';
        }

        // Set global api header
        api.defaults.headers.common['x-api-version'] = resolvedVersion;
        setApiVersion(resolvedVersion);
        console.log("The version of the backend request sending is", resolvedVersion);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to fetch app version config:', error);
        // Fallback to v1 and let the app run if backend is down or unreachable
        api.defaults.headers.common['x-api-version'] = 'v1';
        setApiVersion('v1');
        setIsReady(true);
      }
    };

    checkVersion();
  }, []);

  const handleUpdatePress = () => {
    WebBrowser.openBrowserAsync(playStoreUrl).catch((err) => console.error("An error occurred", err));
  };

  const handleLaterPress = () => {
    setDialogVisible(false);
  };

  const value = useMemo(() => ({ apiVersion }), [apiVersion]);

  if (!isReady && dialogType !== 'force') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0077CB" />
      </View>
    );
  }

  return (
    <VersionContext.Provider value={value}>
      {children}
      
      {dialogType === 'force' && (
        <DialogBox
          visible={dialogVisible}
          title="Update Required"
          message="A new version of the app is required to continue using Mentivo. Please update to the latest version."
          primaryButtonText="Update Now"
          onPrimaryPress={handleUpdatePress}
          // Force update cannot be dismissed
        />
      )}
      
      {dialogType === 'soft' && (
        <DialogBox
          visible={dialogVisible}
          title="Update Available"
          message="A new version of the app is available with new features and improvements!"
          primaryButtonText="Update Now"
          onPrimaryPress={handleUpdatePress}
          secondaryButtonText="Later"
          onSecondaryPress={handleLaterPress}
          showCloseIcon={true}
          onClose={handleLaterPress}
        />
      )}
    </VersionContext.Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  }
});
