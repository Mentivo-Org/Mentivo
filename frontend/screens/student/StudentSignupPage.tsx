import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as WebBrowser from 'expo-web-browser';
import api from '../../services/api';
import { LoginEndpoints, PartnerEndpoints } from '../../constants/endpoint';
import { storage } from '../../services/storage';
import { getStoredReferralCode, saveReferralCode } from '../../services/referral';
import { useLoading } from '../../context/LoadingContext';

import { AuthLayout } from '../../components/AuthLayout';
import DialogBox from '../../components/DialogBox';
import { useAuth } from '../../services/retrieveKeys';

const StudentSignupPage = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const { setUser } = useAuth();

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

  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    primaryButtonText?: string;
    onPrimaryPress?: () => void;
    secondaryButtonText?: string;
    onSecondaryPress?: () => void;
    onClose?: () => void;
  }>({ title: '', message: '' });
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  // Detection itself happens at launch (services/referral.ts), so by the time this
  // screen mounts the code is already persisted. This only resolves it — re-reading
  // on focus rather than once on mount, in case it was captured after mount.
  useFocusEffect(
    useCallback(() => {
      const resolveReferralCode = async () => {
        const { referral_id } = route.params ?? {};
        if (referral_id) {
          const saved = await saveReferralCode(referral_id, { force: true });
          if (saved) setReferralCode(saved);
          return;
        }
        const storedCode = await getStoredReferralCode();
        if (storedCode) setReferralCode(storedCode);
      };

      resolveReferralCode();
    }, [route.params])
  );

  // No password needed for OTP flow
  const {showLoading, hideLoading} = useLoading();

  const handleCreateAccount = async () => {
    if (!fullName || !email || !phone) {
      setAlertData({title: 'Error', message: 'Please fill in all the required fields'});
      setAlertVisible(true);
      return;
    }

    if(Number(phone)<1000000000) {
      setAlertData({title: 'Invalid Phone Number', message: 'Please input a valid phone number'});
      setAlertVisible(true);
      return;
    }

    
    try {
      showLoading("Signing you up...");
      const response = await api.post(LoginEndpoints.signup, {
        email,
        name: fullName,
        phone: phone,
        role: "student",
        referredByReferralCode: referralCode || undefined
      });

      const { data } = response;
      hideLoading();

      if (data.requiresVerification) {
        navigation.navigate("SendOtp", { email: email, name: fullName, role: "student", phone });
      } else {
        navigation.navigate("RoleSelection");
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
      const userInfo = await GoogleSignin.signIn();
      
      const idToken = userInfo?.data?.idToken; 
      if(idToken) {
        showLoading("Fetching your profile info...");
        const response = await api.post(LoginEndpoints.googleLogin, { 
          idToken, 
          mode: "sign-up",
          referredByReferralCode: referralCode || undefined
        })
        hideLoading();
        if (response.status === 202) {
          await storage.setItem('accessToken', response.data.accessToken);
          await storage.setItem('refreshToken', response.data.refreshToken);
          await setUser(response.data.user);
          await storage.setItem('verifiedEmail', 'true');
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
    <AuthLayout>
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
            <Text style={styles.legalText}>By clicking Create Account, you agree to our </Text>
            <TouchableOpacity onPress={() => openBrowser('https://www.mentivo.in/terms')}>
              <Text style={[styles.legalText, styles.underline]}>Terms of Use</Text>
            </TouchableOpacity>
            <Text style={styles.legalText}> and </Text>
            <TouchableOpacity onPress={() => openBrowser('https://www.mentivo.in/privacy')}>
              <Text style={[styles.legalText, styles.underline]}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
      <DialogBox
        title={alertData.title}
        message={alertData.message}
        visible={alertVisible}
        primaryButtonText={alertData.primaryButtonText}
        onPrimaryPress={alertData.onPrimaryPress ? () => {
          setAlertVisible(false);
          alertData.onPrimaryPress?.();
        } : undefined}
        secondaryButtonText={alertData.secondaryButtonText}
        onSecondaryPress={alertData.onSecondaryPress ? () => {
          setAlertVisible(false);
          alertData.onSecondaryPress?.();
        } : undefined}
        onClose={() => {
          setAlertVisible(false);
          alertData.onClose?.();
        }}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
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
    color: '#0077CB',
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
    backgroundColor: '#0077CB',
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
    lineHeight: 18,
  },
  disclaimerLink: {
    textDecorationLine: 'underline',
    color: '#006591',
    fontWeight: '500',
  },
});

export default StudentSignupPage;