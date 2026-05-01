import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import api from "../../services/api";
import { LoginEndpoints } from "../../constants/endpoint";
import { useAuth } from "../../services/retrieveKeys";

interface SignupPageProps {
  navigation?: any;
}

const StudentSignupPage: React.FC<SignupPageProps> = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {setIsSignedIn} = useAuth();

  const handleCreateAccount = () => {
    console.log("Create account", { fullName, email, phone, password });
  };

// const handleGoogleSignUp = async () => {
//   console.log("Sign up with Google");
//   try {
//     await GoogleSignin.hasPlayServices();
//     await GoogleSignin.signOut();
//     const userInfo = await GoogleSignin.signIn({
//       prompt: 'select_account'
//     });
    
//     // This is the 'credential' we send to our backend
//     const idToken = userInfo?.data?.idToken; 
//     console.log(idToken);

//     // Call your Node.js API
//     const response = await api.post(LoginEndpoints.googleLogin, {idToken, mode: "sign-up"})
    
//     const data = await response.data;
//     // console.log(data);
//     if(response.status==200) {
//       await AsyncStorage.setItem('access_token', data?.access_token);
//       await AsyncStorage.setItem('refresh_token', data?.refresh_token);
//       await AsyncStorage.setItem('user', JSON.stringify(data?.user));
//       setIsSignedIn(true);
//     }
//   } catch (error) {
//     console.log("Native Sign-In Cancelled or Failed", error);
//   };
// };

  const handleGoogleSignUp = async () => {
  console.log("Sign up with Google");
  try {
    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signOut();
    const userInfo = await GoogleSignin.signIn({
      prompt: 'select_account'
    });
    
    // This is the 'credential' we send to our backend
    const idToken = userInfo?.data?.idToken; 
    // console.log(idToken);

    // Call your Node.js API
    const response = await api.post(LoginEndpoints.googleLogin, {idToken, mode: "sign-up"})
    
    const data = await response.data;
    console.log(data);
    if(data.email&&data.name) {
      navigation.replace("CompleteProfile", {
        full_name: data.name,
        email: data.email,
        idToken: idToken,
        role: "student"
      })
    }
    // // console.log(data);
    // if(response.status==200) {
    //   await AsyncStorage.setItem('access_token', data?.access_token);
    //   await AsyncStorage.setItem('refresh_token', data?.refresh_token);
    //   await AsyncStorage.setItem('user', JSON.stringify(data?.user));
    //   setIsSignedIn(true);
    // }
  } catch (error) {
    console.log("Native Sign-In Cancelled or Failed", error);
  };
};

  const handleSignIn = () => {
    navigation?.replace("StudentLogin");
  };

  const handleLoginNav = () => {
    navigation?.replace("StudentLogin");
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Ionicons name="school" size={24} color="#00288e" style={styles.brandIcon} />
            <Text style={styles.brandText}>IITian Mentor</Text>
          </View>

          <TouchableOpacity style={styles.loginLink} onPress={handleLoginNav} activeOpacity={0.8}>
            <Text style={styles.loginLinkText}>Log In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the community of expert mentors and students</Text>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignUp}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color="#000000" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>Sign up with Google</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor="#7a849d"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="name@domain.com"
              placeholderTextColor="#7a849d"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 00000 00000"
              placeholderTextColor="#7a849d"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#7a849d"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#00288e"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.passwordHelperText}>ⓘ At least 8 characters</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCreateAccount}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <Text style={styles.bottomText}>
            Already have an account? <Text style={styles.bottomLink} onPress={handleSignIn}>Sign In</Text>
          </Text>

          <Text style={styles.legalText}>
            By clicking Create Account, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>IITian Mentor</Text>
          <Text style={styles.footerCopy}>© 2024 IITian Mentor. Excellence in Guidance.</Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </View>
          <Text style={styles.footerSupport}>Contact Support</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#eef4ff",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandIcon: {
    marginRight: 10,
  },
  brandText: {
    color: "#00288e",
    fontSize: 18,
    fontWeight: "700",
  },
  loginLink: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  loginLinkText: {
    color: "#00288e",
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#d9e1f2",
    padding: 26,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0b1c30",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    marginBottom: 24,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#c4c5d5",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0b1c30",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#d9e1f2",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#7a849d",
    fontSize: 14,
    fontWeight: "600",
  },
  formField: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a2942",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f8ff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d9e1f2",
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f8ff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d9e1f2",
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  eyeButton: {
    marginLeft: 12,
  },
  passwordHelperText: {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: "#00288e",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  bottomText: {
    textAlign: "center",
    color: "#475569",
    fontSize: 15,
    marginBottom: 16,
  },
  bottomLink: {
    color: "#00288e",
    fontWeight: "700",
  },
  legalText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 2,
  },
  footer: {
    width: "100%",
    maxWidth: 460,
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 22,
  },
  footerBrand: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00288e",
    marginBottom: 8,
  },
  footerCopy: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 10,
  },
  footerLinks: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 10,
  },
  footerLink: {
    color: "#475569",
    fontSize: 13,
  },
  footerSupport: {
    color: "#00288e",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default StudentSignupPage;
