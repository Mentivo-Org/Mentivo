import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../services/retrieveKeys";
import { LoginEndpoints } from "../../constants/endpoint";
import api from "../../services/api";
import { ActivityIndicator } from "react-native";
import { usePasswordMask } from "../../hooks/usePasswordMask";

interface LoginPageProps {
  navigation?: any;
}

const StudentLoginPage: React.FC<LoginPageProps> = ({ navigation }) => {
  const {setIsSignedIn} = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { displayValue: passwordDisplay, handleChange: handlePasswordChange } = usePasswordMask(password, setPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setLoading] = useState(false);

const handleEmailLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill in all fields");
    
    setLoading(true);
    try {
      // Using Axios instance for the request
      const response = await api.post(LoginEndpoints.login, {
        email,
        password,
      });

      const { accessToken, refreshToken, user } = response.data;

      // Persist tokens for the Interceptor to use
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      Alert.alert("Success", "Welcome back!");
      navigation.replace('StudentHome'); // Or MentorHome based on user role
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Login failed";
      Alert.alert("Login Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };
const handleGoogleSignIn = async () => {
  console.log("Sign in with Google");
  try {
    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signOut();
    const userInfo = await GoogleSignin.signIn({
      prompt: 'select_account'
    });
    
    const idToken = userInfo?.data?.idToken; 

    // Call Node.js API
    const response = await api.post(LoginEndpoints.googleLogin, { idToken, mode: "sign-in" })
    
    if (response.status === 202) {
      // First time Google user, need to complete profile
      navigation.replace("CompleteProfile", {
        full_name: response.data.name,
        email: response.data.email,
        idToken: idToken,
        role: "student"
      });
      return;
    }

    if (response.status === 200) {
      const { accessToken, refreshToken, user } = response.data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setIsSignedIn(true);
    }
  } catch (error) {
    console.log("Native Sign-In Cancelled or Failed", error);
    const errorMsg = error.response?.data?.error || "Google sign-in failed";
    Alert.alert("Error", errorMsg);
  };
};

  const handlePhoneSignIn = () => {
    console.log("Sign in with Phone");
  };

  const handleForgotPassword = () => {
    navigation?.navigate("ForgotPassword");
  };

  const handleSignUp = () => {
    navigation?.replace("StudentSignUp");
  };

  if(isLoading) {
    return (
      <SafeAreaView>
        <View>
          <ActivityIndicator size={10}/>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color="#00288e"/>
          </TouchableOpacity>
          <Text style={styles.headerBrand}>Mentivo</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.container}>
          <View style={styles.card}>
            {/* Branding/Welcome Section */}
            <View style={styles.brandingSection}>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>
                Access expert guidance from the IIT community
              </Text>
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtonsSection}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleSignIn}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-google" size={20} color="#000" />
                <Text style={styles.socialButtonText}>Sign in with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handlePhoneSignIn}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={18} color="#00288e" />
                <Text style={styles.socialButtonText}>
                  Sign in with Phone Number
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerSection}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Login Form */}
            <View style={styles.formSection}>
              {/* Email Field */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@domain.com"
                  placeholderTextColor="#757684"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password Field */}
              <View style={styles.formField}>
                <View style={styles.passwordHeader}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="∗∗∗∗∗∗∗∗"
                    placeholderTextColor="#757684"
                    value={showPassword ? password : passwordDisplay}
                    onChangeText={showPassword ? setPassword : handlePasswordChange}
                    secureTextEntry={false}
                    autoCapitalize="none"
                    selection={!showPassword ? { start: passwordDisplay.length, end: passwordDisplay.length } : undefined}
                    autoCorrect={false}
                    spellCheck={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye" : "eye-off"}
                      size={20}
                      color="#00288e"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleEmailLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signUpSection}>
              <Text style={styles.signUpText}>
                Don't have an account?{" "}
                <Text style={styles.signUpLink} onPress={handleSignUp}>
                  Sign Up
                </Text>
              </Text>
            </View>
          </View>

          {/* User Avatars Social Proof */}
          <View style={styles.socialProof}>
            <View style={styles.avatarStack}>
              <View style={[styles.avatar, styles.avatar1]}>
                <Ionicons name="person-circle" size={28} color="#00288e" />
              </View>
              <View style={[styles.avatar, styles.avatar2]}>
                <Ionicons name="person-circle" size={28} color="#00288e" />
              </View>
              <View style={[styles.avatar, styles.avatar3]}>
                <Ionicons name="person-circle" size={28} color="#00288e" />
              </View>
            </View>
            <Text style={styles.socialProofText}>
              Joined by 10k+ IITian Mentors
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerBrand}>Mentivo</Text>
        <View style={styles.footerLinks}>
          <Text style={styles.footerLink}>Privacy Policy</Text>
          <Text style={styles.footerLink}>Terms of Service</Text>
          <Text style={styles.footerLink}>Help Center</Text>
        </View>
        <Text style={styles.footerCopyright}>
          © 2026 Mentivo. All rights reserved.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginLeft: 10,
    marginBottom: 24,
    height: 50,
  },
  headerBrand: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00288e",
    letterSpacing: -0.4,
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c4c5d5",
    padding: 24,
    width: "100%",
    maxWidth: 448,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 32,
  },
  brandingSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#0b1c30",
    textAlign: "center",
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#444653",
    textAlign: "center",
  },
  socialButtonsSection: {
    marginBottom: 24,
    gap: 12,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#c4c5d5",
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 17,
    gap: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#0b1c30",
  },
  dividerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#c4c5d5",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "400",
    color: "#444653",
  },
  formSection: {
    marginBottom: 20,
    gap: 24,
  },
  formField: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "400",
    color: "#0b1c30",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#c4c5d5",
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 17,
    fontSize: 16,
    fontWeight: "400",
    color: "#0b1c30",
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  forgotPassword: {
    fontSize: 16,
    fontWeight: "400",
    color: "#006591",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#c4c5d5",
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 17,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: "#0b1c30",
  },
  eyeIcon: {
    marginLeft: 12,
  },
  signInButton: {
    backgroundColor: "#00288e",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#ffffff",
  },
  signUpSection: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  signUpText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#444653",
    textAlign: "center",
  },
  signUpLink: {
    fontWeight: "700",
    color: "#00288e",
  },
  socialProof: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ffffff",
    backgroundColor: "#dce9ff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar1: {
    marginRight: -10,
  },
  avatar2: {
    marginRight: -10,
  },
  avatar3: {},
  socialProofText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#444653",
    flex: 1,
  },
  footer: {
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: 32,
    paddingVertical: 20,
    alignItems: "center",
  },
  footerBrand: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e3a8a",
    marginBottom: 8,
  },
  footerLinks: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 8,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: "400",
    color: "#475569",
  },
  footerCopyright: {
    fontSize: 12,
    fontWeight: "400",
    color: "#475569",
  },
});

export default StudentLoginPage;
