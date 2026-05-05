import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Define the shape of our state
interface AuthContextType {
  isSignedIn: boolean | null;
  setIsSignedIn: (value: boolean | null) => void;
  checkLoginStatus: () => Promise<void>;
  handleLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  // Inside AuthProvider
const checkLoginStatus = async () => {
  console.log("Checking login status...");
  try {
    const access = await AsyncStorage.getItem('accessToken');
    const refresh = await AsyncStorage.getItem('refreshToken');
    
    console.log("Tokens found:", { access: !!access, refresh: !!refresh });

    setIsSignedIn(!!(access && refresh));
    console.log("Logged in status: ", !!(access && refresh) ? "ACTIVE" : "LOGGED OUT")
  } catch (e) {
    console.error("AsyncStorage Error:", e);
    setIsSignedIn(false); 
  }
};

const handleLogout = async ()=> {
  try {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
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
}

  // 2. Run this ONLY when the app starts
  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
  GoogleSignin.configure({
    webClientId: '456108214629-ddj51krdofouhptf81ar6f0h8tb8gsu8.apps.googleusercontent.com', 
    offlineAccess: true, 
    forceCodeForRefreshToken: true,
  });
}, []);

  return (
    <AuthContext.Provider value={{ isSignedIn, setIsSignedIn, checkLoginStatus, handleLogout }}>
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
