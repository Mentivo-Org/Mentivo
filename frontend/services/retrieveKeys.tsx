import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'verifiedEmail']);
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
