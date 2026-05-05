import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoginEndpoints } from '../constants/endpoint';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../services/retrieveKeys';

type SendOtpScreenRouteProp = RouteProp<any, 'SendOtp'>;
type SendOtpScreenNavigationProp = NativeStackNavigationProp<any, 'SendOtp'>;

interface SendOtpScreenProps {
  route: SendOtpScreenRouteProp;
  navigation: SendOtpScreenNavigationProp;
}

export const SendOtpScreen: React.FC<SendOtpScreenProps> = ({ route, navigation }) => {
  const {setIsSignedIn} = useAuth();
    const router = useRoute<any>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<Array<TextInput | null>>([null, null, null, null, null, null]);

  const email = route?.params?.email || '';

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1); // Only take the last character
    setOtp(newOtp);

    // Auto-focus next input if a digit is entered
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpBackspace = (index: number) => {
    if (otp[index] === '' && index > 0) {
      // Move to previous input if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (otp[index] !== '') {
      // Clear current input
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      alert('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(LoginEndpoints.verifyOtp, {
        email, 
        token: otpCode,
        type: 'signup'
      });

      if (response.status >= 200 && response.status < 300) {
        const { accessToken, refreshToken, user } = response.data;
        
        // Store tokens and user info
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('verifiedPhone', "true");
        
        setIsSignedIn(true);
      } else {
        alert('Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      const errorMsg = error.response?.data?.error || 'Failed to verify OTP. Please try again.';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      // TODO: Call backend API to resend OTP
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendTimer(30); // 30 second cooldown
        alert('OTP resent successfully!');
      } else {
        alert('Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP failed:', error);
      alert('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send OTP</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration Section */}
        <View style={styles.illustrationSection}>
          <View style={styles.illustrationBackground}>
            <Text style={styles.illustrationIcon}>📧</Text>
          </View>
        </View>

        {/* Typography Header */}
        <View style={styles.typographyHeader}>
          <Text style={styles.heading}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to {email}
          </Text>
        </View>

        {/* OTP Input Grid */}
        <View style={styles.otpInputContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              placeholder="0"
              placeholderTextColor="#D0D0D0"
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') {
                  handleOtpBackspace(index);
                }
              }}
            />
          ))}
        </View>

        {/* Helper Text & Resend */}
        <View style={styles.helperSection}>
          <Text style={styles.helperText}>Didn't receive code?</Text>
          <TouchableOpacity
            onPress={handleResendOtp}
            disabled={resendTimer > 0 || loading}
          >
            <Text
              style={[
                styles.resendButton,
                (resendTimer > 0 || loading) && styles.resendButtonDisabled,
              ]}
            >
              {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={handleVerifyOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.verifyButtonText}>Verify OTP</Text>
              <Text style={styles.verifyButtonIcon}>→</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Academic Brand Element */}
        <View style={styles.brandElement}>
          <Text style={styles.brandText}>Mentivo - Your Learning Companion</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11.5,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    color: '#1A1A1A',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  illustrationSection: {
    marginVertical: 16,
    alignItems: 'center',
  },
  illustrationBackground: {
    width: 96,
    height: 96,
    backgroundColor: '#F5F5F5',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationIcon: {
    fontSize: 48,
  },
  typographyHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  otpInput: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  otpInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  helperSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  helperText: {
    fontSize: 14,
    color: '#666666',
  },
  resendButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: '#CCCCCC',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verifyButtonIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  brandElement: {
    alignItems: 'center',
    marginTop: 24,
  },
  brandText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
});

export default SendOtpScreen;
