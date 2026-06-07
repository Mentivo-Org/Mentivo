import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import api from '../../services/api';
import { LoginEndpoints } from '../../constants/endpoint';
import { useAuth } from '../../services/retrieveKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLoading } from '../../context/LoadingContext';
import DialogBox from '../../components/DialogBox';

const StudentLoginPage = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setIsSignedIn, setRole, requestNotificationPermissions } = useAuth();
  const {showLoading, hideLoading}  = useLoading();

  const [alertData, setAlertData] = useState({title: '', message: ''});
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  const route=useRoute<any>();
  const {referral_id} = route.params ?? {};

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertData({title:"Error", message: "Please fill in all fields"});
      setAlertVisible(true);
    } 

    showLoading("Logging you  in...");
    try {
      const response = await api.post(LoginEndpoints.login, {
        email,
        password,
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
          navigation.navigate("CompleteProfile", {full_name: user.name, email: user.email, phone: user.phone})
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
      const userInfo = await GoogleSignin.signIn({
        prompt: 'select_account'
      });
      
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'android' ? 70 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.container} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
             <Image source={require('../../app-assets/logo.svg')} style={styles.logo} />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Access expert guidance from the IIT community</Text>

            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
            >
              <Image source={require('../../app-assets/google-icon.svg')} style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Sign in with Google</Text>
            </TouchableOpacity>

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
                onChangeText={setEmail}
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
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={styles.passwordInput} 
                  placeholder="••••••••" 
                  secureTextEntry={!showPassword}
                  placeholderTextColor="rgba(68,70,83,0.5)"
                  // value={password}
                  onChangeText={(text)=>setPassword(text)}
                  autoCapitalize="none"
                  // selection={!showPassword ? { start: passwordDisplay.length, end: passwordDisplay.length } : undefined}
                  autoCorrect={false}
                  spellCheck={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#2563eb"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.signInButton}
              onPress={handleLogin}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('StudentSignUp')}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <DialogBox visible={alertVisible} onClose={()=>setAlertVisible(false)} title={alertData.title} message={alertData.message}/>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 36,
    height: 38,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#c4c5d5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0b1c30',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#444653',
    textAlign: 'center',
    marginBottom: 32,
  },
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c4c5d5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#0b1c30',
  },
  eyeButton: {
    marginLeft: 10,
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
    color: '#00288e',
  },
});

export default StudentLoginPage;
