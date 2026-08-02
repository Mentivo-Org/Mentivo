import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import api from '../../services/api';
import { LoginEndpoints } from '../../constants/endpoint';
import { useAuth } from '../../services/retrieveKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLoading } from '../../context/LoadingContext';
import { authStyles } from '../../styles/authStyles';

import { AuthLayout } from '../../components/AuthLayout';
import DialogBox from '../../components/DialogBox';

const MentorLoginPage = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");


  const handleEmailChange = useCallback((text: string) => setEmail(text), []);

  const { setIsSignedIn, setRole, setUser } = useAuth();
  const {showLoading, hideLoading}  = useLoading();

  const [alertData, setAlertData] = useState({title: '', message: ''});
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

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
    if (!email) {
      setAlertData({title:"Error", message: "Please enter your email"});
      setAlertVisible(true);
      return;
    } 

    showLoading("Requesting OTP...");
    try {
      const response = await api.post(LoginEndpoints.requestLoginOtp, {
        email,
        role: "mentor"
      });

      navigation.navigate("SendOtp", { email, role: "mentor", serverTime: response.data.serverTime });
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
    <AuthLayout>
      <View style={authStyles.card}>
        <Text style={authStyles.title}>Welcome Back</Text>
        <Text style={authStyles.subtitle}>Provide expert guidance from the IIT community</Text>

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

      <View style={styles.legalFooter}>
        <Text style={styles.legalText}>By signing in, you agree to our </Text>
        <TouchableOpacity onPress={() => openBrowser('https://www.mentivo.in/terms')}>
          <Text style={[styles.legalText, styles.underline]}>Terms of Use</Text>
        </TouchableOpacity>
        <Text style={styles.legalText}> and </Text>
        <TouchableOpacity onPress={() => openBrowser('https://www.mentivo.in/privacy')}>
          <Text style={[styles.legalText, styles.underline]}>Privacy Policy</Text>
        </TouchableOpacity>
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
    backgroundColor: '#0077CB',
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
  legalFooter: {
    marginTop: 24,
    paddingHorizontal: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    color: '#444653',
    lineHeight: 20,
  },
  underline: {
    textDecorationLine: 'underline',
  },
});

export default MentorLoginPage;
