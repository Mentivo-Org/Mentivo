import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as WebBrowser from 'expo-web-browser';
import api from '../../services/api';
import { LoginEndpoints, PartnerEndpoints } from '../../constants/endpoint';
import { useAuth } from '../../services/retrieveKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLoading } from '../../context/LoadingContext';
import { authStyles } from '../../styles/authStyles';
import { PasswordInput } from '../../components/PasswordInput';
import { AuthLayout } from '../../components/AuthLayout';
import DialogBox from '../../components/DialogBox';

const StudentLoginPage = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  // useRef instead of useState — reading the value on submit only,
  // so typing never triggers a parent re-render.
  const passwordRef = useRef("");


  // Stable callbacks — referentially equal across re-renders so React.memo
  // on PasswordInput can bail out when the parent re-renders for other reasons.
  const handleEmailChange = useCallback((text: string) => setEmail(text), []);
  const handlePasswordChange = useCallback((text: string) => { passwordRef.current = text; }, []);
  const { setIsSignedIn, setRole, requestNotificationPermissions } = useAuth();
  const {showLoading, hideLoading}  = useLoading();

  const [alertData, setAlertData] = useState({title: '', message: ''});
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  const route=useRoute<any>();
  const {referral_id} = route.params ?? {};

  const openBrowser = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (err) {
      console.warn("expo-web-browser failed, falling back to Linking.openURL:", err);
      try {
        await Linking.openURL(url);
      } catch (linkErr) {
        console.error("Failed to open URL with Linking fallback:", linkErr);
      }
    }
  };

  const handleLogin = async () => {
    if (!email || !passwordRef.current) {
      setAlertData({title:"Error", message: "Please fill in all fields"});
      setAlertVisible(true);
    } 

    showLoading("Logging you  in...");
    try {
      const response = await api.post(LoginEndpoints.login, {
        email,
        password: passwordRef.current,
        role: "student"
      });

      const { data } = response;
      const { accessToken, refreshToken, user } = data;

      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('role', user.role);
      setRole(user.role);

      if(user.isEmailVerified===false) {
        const response = await api.post(LoginEndpoints.resendOtp, {
          email: user.email
        })
        if(response.status===201) {
          navigation.navigate("SendOtp", {email: user.email, name: user.name, role: "student", phone: user.phone});
        }
        else {
          setAlertData({title: 'Error in sending OTP', message: response.data?.error})
          setAlertVisible(true);
        }
      }
      else {
        if(user.profile_completed===false) {
          navigation.navigate("CompleteProfile", {full_name: user.name, email: user.email, phone: user.phone, role: "student"})
        }
        else {
          await AsyncStorage.setItem('verifiedEmail', 'true')
          requestNotificationPermissions();
          setIsSignedIn(true);
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMsg = error.response?.data?.error || "Login failed";
      setAlertData({title:"Error", message: errorMsg});
      setAlertVisible(true);
    }
    finally {
      hideLoading();
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut();
      const userInfo = await GoogleSignin.signIn();
      
      const idToken = userInfo?.data?.idToken;
      showLoading("Logging you in...");

      const response = await api.post(LoginEndpoints.googleLogin, { idToken, mode: "login" })
      
      if (response.status === 202) {
        navigation.replace("SendOtp", {
          full_name: response.data.name,
          email: response.data.email,
          idToken: idToken,
          role: "student"
        });
        return;
      }

      if (response.status === 200 || response.status === 201) {
        const { accessToken, refreshToken, user } = response.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('role', response.data.user.role);
        setRole(response.data.user.role)
        requestNotificationPermissions();
        setIsSignedIn(true);
      }
    } catch (error: any) {
      console.log("Native Sign-In Cancelled or Failed", error);
      const errorMsg = error.response?.data?.error || "Google sign-in failed";
      setAlertData({title: "Error", message: errorMsg});
      setAlertVisible(true)
    }
    finally {
      hideLoading();
    }
  };

  useEffect(()=> {
    const loadReferral = async () => {
      if(referral_id) {
        const past_referral_id = await AsyncStorage.getItem('referral_code');
        await AsyncStorage.setItem('referral_code', referral_id);
        if(past_referral_id) {
          setAlertData({title: "Referral code successfully updated", message: "Please login to activate the referral code"});
          setAlertVisible(true);
        }
        setAlertData({title: "Referral code successfully applied", message: "Please login to activate the referral code"});
        setAlertVisible(true);
      }
    }

    loadReferral();

  },[])

  return (
    <AuthLayout>
      <View style={authStyles.card}>
        <Text style={authStyles.title}>Welcome Back</Text>
        <Text style={authStyles.subtitle}>Access expert guidance from the IIT community</Text>

        <TouchableOpacity 
          style={styles.socialButton}
          onPress={handleGoogleSignIn}
        >
          <Image source={require('../../app-assets/google-icon.svg')} style={styles.socialIcon} />
          <Text style={styles.socialButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <View style={styles.googleDisclaimer}>
          <Text style={styles.disclaimerText}>By continuing with Google, you agree to our </Text>
          <TouchableOpacity onPress={() => openBrowser('https://www.mentivo.in/terms')}>
            <Text style={[styles.disclaimerText, styles.disclaimerLink]}>Terms of Use</Text>
          </TouchableOpacity>
          <Text style={styles.disclaimerText}> and </Text>
          <TouchableOpacity onPress={() => openBrowser('https://www.mentivo.in/privacy')}>
            <Text style={[styles.disclaimerText, styles.disclaimerLink]}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={styles.input} 
            placeholder="name@domain.com" 
            placeholderTextColor="#757684"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword', {role: "student"})}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          <PasswordInput 
            defaultValue=""
            onChangeText={handlePasswordChange}
          />
        </View>

        <TouchableOpacity 
          style={styles.signInButton}
          onPress={handleLogin}
        >
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('StudentSignUp', { referral_id })}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
      <DialogBox visible={alertVisible} onClose={()=>setAlertVisible(false)} title={alertData.title} message={alertData.message}/>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c4c5d5',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 2,
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    color: '#0b1c30',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#c4c5d5',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#444653',
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    color: '#0b1c30',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#c4c5d5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0b1c30',
  },
  forgotPassword: {
    color: '#006591',
    fontSize: 16,
  },
  signInButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 1.75,
  },
  signInText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 16,
    color: '#444653',
  },
  signUpText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077CB',
  },
  googleDisclaimer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#757684',
    textAlign: 'center',
    lineHeight: 18,
  },
  disclaimerLink: {
    textDecorationLine: 'underline',
    color: '#006591',
    fontWeight: '500',
  },
});

export default StudentLoginPage;
