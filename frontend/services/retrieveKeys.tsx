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
      webClientId: '456108214629-ddj51krdofouhptf81ar6f0h8tb8gsu8.apps.googleusercontent.com', 
      offlineAccess: true, 
      forceCodeForRefreshToken: true,
    });
    setIsLoading(false);
  }, []);

  // 3. FCM Token Management
  useEffect(() => {
    if (!isSignedIn) return;

    const messaging = getMessaging();

    const setupFCM = async () => {
      try {
        const authStatus = await requestPermission(messaging);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Authorization status:', authStatus);
          const token = await getToken(messaging);
          const storedToken = await AsyncStorage.getItem('fcmToken');
          
          // Send to backend if new or changed
          if (token && token !== storedToken) {
            console.log('Sending FCM token to backend...');
            try {
              if (storedToken) {
                await api.put(NotificationEndpoints.updateFcmToken, { oldToken: storedToken, newToken: token });
              } else {
                await api.post(NotificationEndpoints.addFcmToken, { token });
              }
              await AsyncStorage.setItem('fcmToken', token);
            } catch (err) {
              console.error('Failed to send FCM token to backend:', err);
            }
          }
        }
      } catch (error) {
        console.error('FCM Setup Error:', error);
      }
    };

    setupFCM();

    // Listen to token refresh
    const unsubscribeTokenRefresh = onTokenRefresh(messaging, async (newToken) => {
      console.log('FCM Token refreshed', newToken);
      try {
        const oldToken = await AsyncStorage.getItem('fcmToken');
        if (oldToken) {
          await api.put(NotificationEndpoints.updateFcmToken, { oldToken, newToken });
        } else {
          await api.post(NotificationEndpoints.addFcmToken, { token: newToken });
        }
        await AsyncStorage.setItem('fcmToken', newToken);
      } catch (err) {
        console.error('Failed to update refreshed FCM token:', err);
      }
    });

    return () => {
      unsubscribeTokenRefresh();
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

