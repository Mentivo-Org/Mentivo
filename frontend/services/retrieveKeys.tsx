import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessaging, requestPermission, getToken, onTokenRefresh, AuthorizationStatus, onMessage } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import api from './api';
import { NotificationEndpoints } from '../constants/endpoint';
import { useLoading } from '../context/LoadingContext';

// 1. Define the shape of our state
interface AuthContextType {
  isSignedIn: boolean | null;
  setIsSignedIn: (value: boolean | null) => void;
  role: string | null;
  setRole: (value: string | null) => void;
  checkLoginStatus: () => Promise<void>;
  handleLogout: () => Promise<void>;
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { showLoading, hideLoading } = useLoading();
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Inside AuthProvider
const checkLoginStatus = async () => {
  console.log("Checking login status...");
  try {
    const access = await AsyncStorage.getItem('accessToken');
    const refresh = await AsyncStorage.getItem('refreshToken');
    const user = await AsyncStorage.getItem('user');
    const storedRole = await AsyncStorage.getItem('role');
    var verifiedEmail = await AsyncStorage.getItem('verifiedEmail');
    if(verifiedEmail !== 'true') {
      verifiedEmail = null;
    }
    console.log("Tokens found:", { access: !!access, refresh: !!refresh, user: !!user,  verifiedEmail: !!verifiedEmail });

    setIsSignedIn(!!(access && refresh && verifiedEmail && user));
    setRole(storedRole);
    console.log("Logged in status: ", !!(access && refresh && user && verifiedEmail) ? "ACTIVE" : "LOGGED OUT")
  } catch (e) {
    console.error("AsyncStorage Error:", e);
    setIsSignedIn(false); 
  }
};

const handleLogout = async ()=> {
  showLoading("Logging out...");
  try {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'verifiedEmail', 'fcmToken', 'role']);
    const isGoogleSignedIn = await GoogleSignin.hasPreviousSignIn();
    if(isGoogleSignedIn) {
      await GoogleSignin.signOut();
    }
    setIsSignedIn(false);
    setRole(null);
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
    
    // Request notification permission and setup channel on first launch
    const initializeNotifications = async () => {
      try {
        await notifee.requestPermission();
        await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
        });
        console.log('Notifications initialized on app launch');
      } catch (err) {
        console.error('Failed to initialize notifications on launch:', err);
      }
    };
    initializeNotifications();
    
    setIsLoading(false);
  }, []);

  // 3. FCM Token Management
  useEffect(() => {
    if (!isSignedIn) return;

    const setupFCM = async () => {
      try {
        console.log('Starting FCM setup...');
        const messagingInstance = getMessaging();
        
        const authStatus = await requestPermission(messagingInstance);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        console.log('FCM Authorization status:', authStatus, 'Enabled:', enabled);

        if (enabled) {
          const token = await getToken(messagingInstance);
          console.log('FCM Token obtained:', token ? 'YES' : 'NO');
          
          if (token) {
            const storedToken = await AsyncStorage.getItem('fcmToken');
            
            // Send to backend if new or changed
            if (token !== storedToken) {
              console.log('Syncing FCM token with backend...');
              try {
                const response = await api.post(NotificationEndpoints.syncFcmToken, { token });
                
                if (response.status === 200 || response.status === 201) {
                  await AsyncStorage.setItem('fcmToken', token);
                  console.log(`FCM token synced (Status: ${response.status})`);
                }
              } catch (err) {
                console.error('Failed to sync FCM token with backend:', err);
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

    const messaging = getMessaging();

    // Listen to foreground notifications
    const unsubscribeOnMessage = onMessage(messaging, async (remoteMessage) => {
      console.log('--- [FCM MESSAGE RECEIVED (FOREGROUND)] ---');
      console.log('Payload:', JSON.stringify(remoteMessage, null, 2));

      if (remoteMessage.data?.source === 'admin-dashboard') {
        console.log('>>> DETECTED: Push notification from Admin Dashboard');
      }

      const title = remoteMessage.notification?.title || remoteMessage.data?.title;
      const body = remoteMessage.notification?.body || remoteMessage.data?.body;

      if (title || body) {
        console.log('>>> ATTEMPTING: Displaying notification via Notifee');
        try {
          // Check/Request Notifee specific permission for Android 13+
          const settings = await notifee.requestPermission();
          console.log('Notifee Permission Status:', settings.authorizationStatus);

          await notifee.displayNotification({
            title: title || 'Mentivo Notification',
            body: body || 'You have a new message',
            data: remoteMessage.data,
            android: {
              channelId: 'default',
              importance: AndroidImportance.HIGH,
              pressAction: {
                id: 'default',
              },
            },
          });
          console.log('>>> SUCCESS: notifee.displayNotification called');
        } catch (err) {
          console.error('>>> ERROR: notifee.displayNotification failed', err);
        }
      } else {
        console.log('>>> SKIPPED: No title or body found in message payload');
      }
    });

    let unsubscribeTokenRefresh: (() => void) | undefined;
    
    try {
      unsubscribeTokenRefresh = onTokenRefresh(messaging, async (newToken) => {
        console.log('FCM Token refreshed', newToken);
        try {
          const oldToken = await AsyncStorage.getItem('fcmToken');
          if (newToken !== oldToken) {
            console.log('Syncing refreshed FCM token with backend...');
            const response = await api.post(NotificationEndpoints.syncFcmToken, { token: newToken });
            
            if (response.status === 200 || response.status === 201) {
              await AsyncStorage.setItem('fcmToken', newToken);
              console.log(`Refreshed FCM token synced (Status: ${response.status})`);
            }
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
      unsubscribeOnMessage();
    };
  }, [isSignedIn]);

  return (
    <AuthContext.Provider value={{ isSignedIn, setIsSignedIn, role, setRole, checkLoginStatus, handleLogout, isLoading }}>
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

