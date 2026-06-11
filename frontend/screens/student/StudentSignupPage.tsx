import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import api from '../../services/api';
import { LoginEndpoints } from '../../constants/endpoint';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLoading } from '../../context/LoadingContext';
import { PasswordInput } from '../../components/PasswordInput';
import DialogBox from '../../components/DialogBox';

const StudentSignupPage = () => {
  const navigation = useNavigation<any>();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [alertData, setAlertData] = useState({title:'', message: ''})
  const [alertVisible, setAlertVisible] = useState<boolean>(false);
  const {showLoading, hideLoading} = useLoading();

  const handleCreateAccount = async () => {
    if (!fullName || !email || !password || !phone) {
      setAlertData({title: 'Error', message: 'Please fill in all the required fields'});
      setAlertVisible(true);
      return;
    }

    if(Number(phone)<1000000000) {
      setAlertData({title: 'Invalid Phone Number', message: 'Please input a valid phone number'});
      setAlertVisible(true);
    }
    
    try {
      showLoading("Signing you up...");
      const response = await api.post(LoginEndpoints.signup, {
        email,
        password,
        name: fullName,
        phone: phone,
        role: "student"
      });

      const { data } = response;
      hideLoading();
      if (data.requiresVerification) {
        // const { accessToken, refreshToken, user } = data;
        // await AsyncStorage.setItem('accessToken', accessToken);
        // await AsyncStorage.setItem('refreshToken', refreshToken);
        // await AsyncStorage.setItem('user', JSON.stringify(user));
        // await AsyncStorage.setItem('verifiedEmail', 'false');

        navigation.navigate("SendOtp", { email: email, name: fullName, role: "student" , phone});
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      const errorMsg = error.response?.data?.error || "Signup failed";
      setAlertData({title:"Error", message: errorMsg});
      setAlertVisible(true);
    }
    finally {
      hideLoading();
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut();
      const userInfo = await GoogleSignin.signIn({
        prompt: 'select_account'
      });
      
      const idToken = userInfo?.data?.idToken; 
      if(idToken) {
        showLoading("Fetching your profile info...");
        const response = await api.post(LoginEndpoints.googleLogin, { idToken, mode: "sign-up" })
        hideLoading();
        if (response.status === 202) {
          await AsyncStorage.setItem('accessToken', response.data.accessToken);
          await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
          await AsyncStorage.setItem('verifiedEmail', 'true');
        navigation.replace("CompleteProfile", {
          full_name: response.data.user?.name,
          email: response.data.user?.email,
          role: "student"
        });
        return;
      }
    }
    } catch (error: any) {
      console.log("Native Sign-In Cancelled or Failed", error);
      const errorMsg = error.response?.data?.error || "Google sign-up failed";
      setAlertData({message: errorMsg, title: 'Google sign in failed'});
      setAlertVisible(true)
    }
    finally {
      hideLoading();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior="padding"
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.container} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
             <Image source={require('../../app-assets/logo.svg')} style={styles.logo} />
          </View>

          <View style={styles.topSection}>
            <Text style={styles.mainTitle}>Create Account</Text>
            <Text style={styles.mainSubtitle}>Join the community of expert mentors and students</Text>
          </View>

          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleGoogleSignUp}
            >
              <Image source={require('../../app-assets/google-icon.svg')} style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Sign up with Google</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Your full name" 
                placeholderTextColor="rgba(68,70,83,0.5)"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput 
                style={styles.input} 
                placeholder="name@domain.com" 
                placeholderTextColor="rgba(68,70,83,0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5}}>
              <Text style={styles.label}>Phone Number (Whatsapp)</Text>
              <Text style={styles.required}>* Required</Text>
              </View>
              <TextInput 
                style={styles.input} 
                placeholder="98765 12345" 
                placeholderTextColor="rgba(68,70,83,0.5)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <PasswordInput 
                value={password}
                onChangeText={setPassword}
                style={styles.passwordContainer}
                inputStyle={styles.passwordInput}
              />
              <View style={styles.hintContainer}>
                <Image source={require('../../app-assets/info-dot.svg')} style={styles.hintIcon} />
                <Text style={styles.hintText}>At least 8 characters</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateAccount}
            >
              <Text style={styles.createText}>Create Account</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('StudentLogin')}>
                <Text style={styles.signInText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.legalFooter}>
            <Text style={styles.legalText}>
              By clicking Create Account, you agree to our{' '}
              <Text style={styles.underline}>Terms of Service</Text> and{' '}
              <Text style={styles.underline}>Privacy Policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <DialogBox title={alertData.title} message={alertData.message} visible={alertVisible} onClose={()=> setAlertVisible(false)}/>
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
    marginBottom: 20,
  },
  logo: {
    width: 40,
    height: 42,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 14,
    marginTop: -10
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#0b1c30',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.32,
  },
  mainSubtitle: {
    fontSize: 16,
    color: '#444653',
    textAlign: 'center',
    lineHeight: 24,
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
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c4c5d5',
    borderRadius: 8,
    paddingVertical: 12,
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 17,
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
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.64,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 17,
    color: '#0b1c30',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#eff4ff',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    color: '#0b1c30',
  },
  required: {
    fontSize: 12,
    color: '#00288e',
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff4ff',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 0,
  },
  passwordInput: {
    flex: 1,
    fontSize: 17,
    color: '#0b1c30',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  hintIcon: {
    width: 10,
    height: 10,
    marginRight: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#444653',
  },
  createButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 1.75,
  },
  createText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 17,
    color: '#444653',
  },
  signInText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2563eb',
  },
  legalFooter: {
    marginTop: 24,
    paddingHorizontal: 10,
  },
  legalText: {
    fontSize: 12,
    color: '#444653',
    textAlign: 'center',
    lineHeight: 20,
  },
  underline: {
    textDecorationLine: 'underline',
  },
});

export default StudentSignupPage;