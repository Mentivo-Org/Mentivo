import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessaging, requestPermission, getToken, onTokenRefresh, AuthorizationStatus } from '@react-native-firebase/messaging';
import api from './api';
import { NotificationEndpoints } from '../constants/endpoint';
import { useLoading } from '../context/LoadingContext';

// 1. Define the shape of our state
interface AuthContextType {
  isSignedIn: boolean | null;
  setIsSignedIn: (value: boolean | null) => void;
  checkLoginStatus: () => Promise<void>;
  handleLogout: () => Promise<void>;
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { showLoading, hideLoading } = useLoading();
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Inside AuthProvider
const checkLoginStatus = async () => {
  console.log("Checking login status...");
  try {
    const access = await AsyncStorage.getItem('accessToken');
    const refresh = await AsyncStorage.getItem('refreshToken');
    const user = await AsyncStorage.getItem('user');
    var verifiedEmail = await AsyncStorage.getItem('verifiedEmail');
    if(verifiedEmail !== 'true') {
      verifiedEmail = null;
    }
    console.log("Tokens found:", { access: !!access, refresh: !!refresh, user: !!user,  verifiedEmail: !!verifiedEmail });

    setIsSignedIn(!!(access && refresh && verifiedEmail && user));
    console.log("Logged in status: ", !!(access && refresh && user && verifiedEmail) ? "ACTIVE" : "LOGGED OUT")
  } catch (e) {
    console.error("AsyncStorage Error:", e);
    setIsSignedIn(false); 
  }
};

const handleLogout = async ()=> {
  showLoading("Logging out...");
  try {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'verifiedEmail', 'fcmToken']);
    const isGoogleSignedIn = await GoogleSignin.hasPreviousSignIn();
    if(isGoogleSignedIn) {
      await GoogleSignin.signOut();
    }
    setIsSignedIn(false);
    console.log("User successfully signed out");
  }
  catch(e) {
    console.error("Logout failed", e);
  }
  finally {
    hideLoading();
  }
}

  // 2. Run this ONLY when the app starts
  useEffect(() => {
    setIsLoading(true);
    checkLoginStatus();
    GoogleSignin.configure({
      webClientId: '865059452188-k8gi046e0eaodb8pd5i19d6jan19r4fd.apps.googleusercontent.com', 
      offlineAccess: true, 
      forceCodeForRefreshToken: true,
    });
    setIsLoading(false);
  }, []);

  // 3. FCM Token Management
  useEffect(() => {
    if (!isSignedIn) return;

    const setupFCM = async () => {
      try {
        console.log('Starting FCM setup...');
        const messaging = getMessaging();
        
        const authStatus = await requestPermission(messaging);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        console.log('FCM Authorization status:', authStatus, 'Enabled:', enabled);

        if (enabled) {
          const token = await getToken(messaging);
          console.log('FCM Token obtained:', token ? 'YES' : 'NO');
          
          if (token) {
            const storedToken = await AsyncStorage.getItem('fcmToken');
            
            // Send to backend if new or changed
            if (token !== storedToken) {
              console.log('Sending FCM token to backend...');
              try {
                if (storedToken) {
                  await api.put(NotificationEndpoints.updateFcmToken, { oldToken: storedToken, newToken: token });
                } else {
                  await api.post(NotificationEndpoints.addFcmToken, { token });
                }
                await AsyncStorage.setItem('fcmToken', token);
                console.log('FCM token successfully synced with backend');
              } catch (err) {
                console.error('Failed to send FCM token to backend:', err);
              }
            } else {
              console.log('FCM token unchanged, skipping sync');
            }
          }
        } else {
          console.warn('FCM permissions not granted');
        }
      } catch (error) {
        console.error('FCM Setup Error:', error);
      }
    };

    setupFCM();

    // Listen to token refresh
    let unsubscribeTokenRefresh: (() => void) | undefined;
    
    try {
      const messaging = getMessaging();
      unsubscribeTokenRefresh = onTokenRefresh(messaging, async (newToken) => {
        console.log('FCM Token refreshed', newToken);
        try {
          const oldToken = await AsyncStorage.getItem('fcmToken');
          if (newToken !== oldToken) {
            if (oldToken) {
              await api.put(NotificationEndpoints.updateFcmToken, { oldToken, newToken });
            } else {
              await api.post(NotificationEndpoints.addFcmToken, { token: newToken });
            }
            await AsyncStorage.setItem('fcmToken', newToken);
            console.log('Refreshed FCM token synced with backend');
          }
        } catch (err) {
          console.error('Failed to update refreshed FCM token:', err);
        }
      });
    } catch (err) {
      console.error('Failed to setup FCM token refresh listener:', err);
    }

    return () => {
      if (unsubscribeTokenRefresh) unsubscribeTokenRefresh();
    };
  }, [isSignedIn]);

  return (
    <AuthContext.Provider value={{ isSignedIn, setIsSignedIn, checkLoginStatus, handleLogout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Custom hook for easy access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

