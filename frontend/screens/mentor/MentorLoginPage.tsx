import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import api from '../../services/api';
import { LoginEndpoints } from '../../constants/endpoint';
import { useAuth } from '../../services/retrieveKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLoading } from '../../context/LoadingContext';
import { PasswordInput } from '../../components/PasswordInput';
import DialogBox from '../../components/DialogBox';

const MentorLoginPage = () => {
  const navigation = useNavigation<any>();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  const [email, setEmail] = useState("");
  const passwordRef = useRef("");

  const handleEmailChange = useCallback((text: string) => setEmail(text), []);
  const handlePasswordChange = useCallback((text: string) => { passwordRef.current = text; }, []);
  const { setIsSignedIn, setRole, requestNotificationPermissions } = useAuth();
  const {showLoading, hideLoading}  = useLoading();

  const [alertData, setAlertData] = useState({title: '', message: ''});
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email || !passwordRef.current) {
      setAlertData({title:"Error", message: "Please fill in all fields"});
      setAlertVisible(true);
      return;
    } 

    showLoading("Logging you in...");
    try {
      const response = await api.post(LoginEndpoints.login, {
        email,
        password: passwordRef.current,
        role: "mentor"
      });

      const { data } = response;
      const { accessToken, refreshToken, user } = data;

      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('role', user.role);
      setRole(user.role);

      if(user.isEmailVerified===false) {
        const resendResponse = await api.post(LoginEndpoints.resendOtp, {
          email: user.email
        })
        if(resendResponse.status===201) {
          navigation.navigate("SendOtp", {email: user.email, name: user.name, role: "mentor", phone: user.phone});
        }
        else {
          setAlertData({title: 'Error in sending OTP', message: resendResponse.data?.error})
          setAlertVisible(true);
        }
      }
      else {
        if(user.profile_completed===false) {
          // If it's a mentor, we need to fetch IIT name before navigating
          const iitResponse = await api.post(LoginEndpoints.getIIT, { email: user.email });
          navigation.navigate("CompleteProfile", {
            full_name: user.name, 
            email: user.email, 
            phone: user.phone, 
            role: "mentor",
            iit: iitResponse.data?.name_of_iit
          });
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : (isKeyboardVisible ? 'height' : undefined)}
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
            <Text style={styles.subtitle}>Provide expert guidance from the IIT community</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>College Email ID</Text>
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
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword', {role: "mentor"})}>
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
              <TouchableOpacity onPress={() => navigation.navigate('MentorSignUp')}>
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
    width: 40,
    height: 42,
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
});

export default MentorLoginPage;
