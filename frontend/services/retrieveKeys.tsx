import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Define the shape of our state
interface AuthContextType {
  isSignedIn: boolean | null;
  setIsSignedIn: (value: boolean | null) => void;
  checkLoginStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  // Inside AuthProvider
const checkLoginStatus = async () => {
  console.log("Checking login status...");
  try {
    const access = await AsyncStorage.getItem('access_token');
    const refresh = await AsyncStorage.getItem('refresh_token');
    
    console.log("Tokens found:", { access: !!access, refresh: !!refresh });

    // Explicitly set to true or false. NEVER leave it as null.
    setIsSignedIn(!!(access && refresh));
  } catch (e) {
    console.error("AsyncStorage Error:", e);
    setIsSignedIn(false); // If it fails, default to logged out
  }
};

  // 2. Run this ONLY when the app starts
  useEffect(() => {
    checkLoginStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isSignedIn, setIsSignedIn, checkLoginStatus }}>
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