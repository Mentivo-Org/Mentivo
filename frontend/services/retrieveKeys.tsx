import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { storage } from './storage';
import { getMessaging, requestPermission, getToken, onTokenRefresh, AuthorizationStatus, onMessage } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import api from './api';
import { socketManager } from './socketManager';
import { NotificationEndpoints, MentorEndpoints, LoginEndpoints } from '../constants/endpoint';
import { useLoading } from '../context/LoadingContext';

// 1. Define the shape of our state
interface AuthContextType {
  isSignedIn: boolean | null;
  setIsSignedIn: (value: boolean | null) => void;
  role: string | null;
  setRole: (value: string | null) => void;
  user: any;
  setUser: (value: any) => void;
  mentorlevel: string | null;
  verificationStatus: string | null;
  checkLoginStatus: (forceFetch?: boolean) => Promise<void>;
  handleLogout: () => Promise<void>;
  requestNotificationPermissions: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { showLoading, hideLoading } = useLoading();
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [user, setUserState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const mentorlevel = user?.mentorProfile?.mentorlevel || null;
  const verificationStatus = user?.mentorProfile?.verificationStatus || null;

  const setUser = useCallback(async (u: any) => {
    setUserState(u);
    if (u) {
      await storage.setItem('user', JSON.stringify(u));
    } else {
      await storage.removeItem('user');
    }
  }, []);

  const checkLoginStatus = useCallback(async (forceFetch: boolean = false) => {
    console.log("Checking login status...");
    try {
      if (forceFetch) {
        try {
          const response = await api.get(LoginEndpoints.whoAmI);
          if (response.status === 200 && response.data?.user) {
            await setUser(response.data.user);
          }
        } catch (apiError) {
          console.error("Failed to force fetch user:", apiError);
        }
      }

      const access = await storage.getItem('accessToken');
      const refresh = await storage.getItem('refreshToken');
      const userJson = await storage.getItem('user');
      const storedRole = await storage.getItem('role');
      var verifiedEmail = await storage.getItem('verifiedEmail');
      if(verifiedEmail !== 'true') {
        verifiedEmail = null;
      }
      console.log("Tokens found:", { access: !!access, refresh: !!refresh, user: !!userJson,  verifiedEmail: !!verifiedEmail });

      const parsedUser = userJson ? JSON.parse(userJson) : null;
      setUserState(parsedUser);

      setIsSignedIn(!!(access && refresh && verifiedEmail && userJson));
      setRole(storedRole);
      console.log("Logged in status: ", !!(access && refresh && userJson && verifiedEmail) ? "ACTIVE" : "LOGGED OUT")

    } catch (e) {
      console.error("AsyncStorage Error:", e);
      setIsSignedIn(false);
    }
  }, [setUser]);

  const handleLogout = useCallback(async ()=> {
    showLoading("Logging out...");
    try {
      const currentRole = role || await storage.getItem('role');
      if (currentRole === 'mentor') {
        try {
          await api.post(MentorEndpoints.setStatus, { isOnline: false });
          console.log("Mentor status set to offline during logout");
        } catch (statusErr) {
          console.error("Failed to update mentor status to offline on logout:", statusErr);
        }
      }
      const fcmToken = await storage.getItem('fcmToken');
      const response = await api.patch(NotificationEndpoints.syncFcmToken, {token: fcmToken});
      if(response.status!==200) {
        console.error("Error removing fcm token from database");
      }
      await storage.multiRemove(['accessToken', 'refreshToken', 'user', 'verifiedEmail', 'fcmToken', 'role']);
      const isGoogleSignedIn = await GoogleSignin.hasPreviousSignIn();
      if(isGoogleSignedIn) {
        await GoogleSignin.signOut();
      }
      setIsSignedIn(false);
      setRole(null);
      setUserState(null);
      console.log("User successfully signed out");
    }
    catch(e) {
      console.error("Logout failed", e);
    }
    finally {
      hideLoading();
    }
  }, [role, showLoading, hideLoading]);

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

  const requestNotificationPermissions = useCallback(async () => {
    try {
      console.log('Requesting notification permissions...');
      await notifee.requestPermission();
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });
      console.log('Notifee initialized');

      console.log('Starting FCM setup...');
      const messagingInstance = getMessaging();
      
      const authStatus = await requestPermission(messagingInstance);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      console.log('FCM Authorization status:', authStatus, 'Enabled:', enabled);

      if (enabled) {
        const token = await getToken(messagingInstance);
        if (token) {
          console.log('FCM Token obtained:', token);
          const response = await api.post(NotificationEndpoints.syncFcmToken, { token });
          if (response.status === 200 || response.status === 201) {
            await storage.setItem('fcmToken', token);
            console.log('FCM token synced with backend');
          }
        }
      }
    } catch (err) {
      console.error('Failed to request notification permissions:', err);
    }
  }, []);

  // 3. FCM Token Management
  useEffect(() => {
    if (!isSignedIn) return;

    const setupFCM = async () => {
      try {
        console.log('Starting background FCM setup check...');
        const messagingInstance = getMessaging();
        const token = await getToken(messagingInstance);
        
        if (token) {
          const storedToken = await storage.getItem('fcmToken');
          if (token !== storedToken) {
            console.log('Syncing FCM token with backend...');
            try {
              const response = await api.post(NotificationEndpoints.syncFcmToken, { token });
              if (response.status === 200 || response.status === 201) {
                await storage.setItem('fcmToken', token);
              }
            } catch (err) {
              console.error('Failed to sync FCM token:', err);
            }
          }
        }
      } catch (error) {
        console.error('FCM background check Error:', error);
      }
    };

    setupFCM();

    const messaging = getMessaging();

    let unsubscribeTokenRefresh: (() => void) | undefined;
    
    try {
      unsubscribeTokenRefresh = onTokenRefresh(messaging, async (newToken) => {
        console.log('FCM Token refreshed', newToken);
        try {
          const oldToken = await storage.getItem('fcmToken');
          if (newToken !== oldToken) {
            console.log('Syncing refreshed FCM token with backend...');
            const response = await api.post(NotificationEndpoints.syncFcmToken, { token: newToken });

            if (response.status === 200 || response.status === 201) {
              await storage.setItem('fcmToken', newToken);
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
    };
  }, [isSignedIn]);

  // 4. Socket.io lifecycle management
  useEffect(() => {
    if (isSignedIn) {
      const initSocket = async () => {
        const token = await storage.getItem('accessToken');
        const userJson = await storage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        
        if (token && user?.id) {
          socketManager.connect(token, user.id);
        }
      };
      initSocket();
    } else if (isSignedIn === false) {
      socketManager.disconnect();
    }
  }, [isSignedIn]);

  const value = useMemo(
    () => ({ isSignedIn, setIsSignedIn, role, setRole, user, setUser, mentorlevel, verificationStatus, checkLoginStatus, handleLogout, requestNotificationPermissions, isLoading }),
    [isSignedIn, role, user, mentorlevel, verificationStatus, setUser, checkLoginStatus, handleLogout, requestNotificationPermissions, isLoading]
  );

  return (
    <AuthContext.Provider value={value}>
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

