import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import api from '../services/api';
import { LoginEndpoints } from '../constants/endpoint';
import { useLoading } from '../context/LoadingContext';
import DialogBox from '../components/DialogBox';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SendOtpScreen = () => {
  const { showLoading, hideLoading } = useLoading();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { email, name, role, phone } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<any>([]);
  const [secondsLeft, setSecondsLeft] = useState<number>(60);
  const [resend, setResend] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [alertData, setAlertData] = useState({title: '', message: ''});
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  const maskEmail = (email: string) => {
  if (!email || !email.includes('@')) return email;

  const [localPart, domain] = email.split('@');
  
  let maskedLocal;
  
  if (localPart.length <= 2) {
    // For short names like "ab@domain.com" -> "a*@domain.com"
    maskedLocal = localPart[0] + '*';
  } else {
    // Keeps the first and last character, masks everything in between
    const firstChars = localPart[0] + localPart[1];
    const lastChars = localPart[localPart.length - 2] + localPart[localPart.length - 1];
    const maskLength = localPart.length - 4;
    
    maskedLocal = firstChars + '*'.repeat(maskLength) + lastChars;
  }
  
  return `${maskedLocal}@${domain}`;
};

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');
    if(otpString.length<6) {
      setAlertData({title: 'OTP Error', message: 'Fill all the fields'});
      setAlertVisible(true);
      return;
    }
    showLoading();
    try {
      const response = await api.post(LoginEndpoints.verifyOtp, {email, token: otpString, name, phone, role});
      if(response.status === 200) {
        await AsyncStorage.setItem('acccessToken', response.data.accessToken);
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        //will be set after completeprofile
        // await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        await  AsyncStorage.setItem('verifiedEmail', 'true')

        //if mentor, fetch IIT name using domain of email ID
        if(role==="mentor") {
          const iit = await api.post(LoginEndpoints.getIIT, {email});
          if (iit.status===200) {
            navigation.navigate("CompleteProfile", {full_name: name, role, email, phone, iit: iit.data?.name_of_iit})
          }
          else {
            setAlertData({title: "Could not fetch IIT name", message: iit.data?.error});
            setAlertVisible(true);
          }
        }
        else {
          navigation.navigate("CompleteProfile", {full_name: name, role, email, phone})
        }
      }
    } catch (error) {
      setAlertData({title: 'Verification Failed', message: 'Please check your OTP and try again.'});
      setAlertVisible(true);
    } finally {
      hideLoading();
    }
  };

  const handleResend = async () => {
    if(secondsLeft===0) {
      await resendOtp();
    }
  }

  const resendOtp = async () => {
    showLoading();
    try {
      const response = await api.post(LoginEndpoints.resendOtp, {email});
      if(response.status===201) {
        setSecondsLeft(60);
        setResend(false);
        setOtp(['','','','','',''])
        inputs.current[0].focus();
      }
      else {
        setAlertData({title:'Resend OTP Failed', message: response.data?.error});
        setAlertVisible(true);
      }
    } catch (error) {
      setAlertData({title:'Resend Failed', message: 'Could not resend OTP. Please try again.'});
      setAlertVisible(true);
    } finally {
      hideLoading();
    }
  }

  useEffect(() => {
  if (resend === false && secondsLeft > 0) {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
  } else if (secondsLeft === 0) {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }
    setResend(false);
  }
  return () => {
    if (timerRef.current !== null) clearInterval(timerRef.current);
  };
}, [resend, secondsLeft]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>OTP Verification</Text>
        </View>

        <View style={styles.container}>
          <View style={styles.illustrationContainer}>
            <View style={styles.iconCircle}>
              <Image source={require('../app-assets/shield-icon.svg')} style={styles.shieldIcon} />
            </View>
          </View>

          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to {maskEmail(email)}</Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputs.current[index] = ref)}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={() => handleResend()}>
              <Text style={[styles.resendAction, (secondsLeft==0)?{color: 'blue'}:{}]}>Resend {(secondsLeft!==0)?`in ${secondsLeft}`:'code'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.brandContainer}>
            <Text style={styles.brandText}>NETWORK SECURE LOGIN</Text>
          </View>

          <TouchableOpacity 
            style={styles.verifyButton}
            onPress={() => handleSubmit()}
          >
            <Text style={styles.verifyText}>Verify & Continue</Text>
            <Image 
              source={require('../app-assets/arrow-right-white.svg')} 
              style={styles.arrowIcon} 
              tintColor="white"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <DialogBox title={alertData.title} message={alertData.message} onClose={() => setAlertVisible(false)} visible={alertVisible}/>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  illustrationContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5eeff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldIcon: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0b1c30',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#444653',
    textAlign: 'center',
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#c4c5d5',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0b1c30',
  },
  resendContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#444653',
  },
  resendAction: {
    fontSize: 14,
    color: '#00288e',
    fontWeight: '600',
  },
  brandContainer: {
    opacity: 0.5,
    marginBottom: 40,
  },
  brandText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#757684',
    letterSpacing: 1,
  },
  verifyButton: {
    backgroundColor: '#2563eb',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 1.75,
  },
  verifyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    marginRight: 10,
  },
  arrowIcon: {
    width: 12,
    height: 12,
  },
});

export default SendOtpScreen;
