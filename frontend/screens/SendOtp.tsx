import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const imgShieldIcon = "https://www.figma.com/api/mcp/asset/ca0cc608-9615-4191-bf72-ef341f546fe1";
const imgArrowRight = "https://www.figma.com/api/mcp/asset/52d1a7f3-0c6f-43e4-bab1-8076ae5b8c7e";

const SendOtpScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { role } = route.params || { role: 'student' };
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<any>([]);

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
              <Image source={{ uri: imgShieldIcon }} style={styles.shieldIcon} />
            </View>
          </View>

          <Text style={styles.title}>Verify Your Phone</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to +917980*******</Text>

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
            <TouchableOpacity>
              <Text style={styles.resendAction}>Resend in 0:45</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.brandContainer}>
            <Text style={styles.brandText}>IITIAN MENTOR NETWORK SECURE LOGIN</Text>
          </View>

          <TouchableOpacity 
            style={styles.verifyButton}
            onPress={() => navigation.navigate('CompleteProfile', { role })}
          >
            <Text style={styles.verifyText}>Verify & Continue</Text>
            <Image source={{ uri: imgArrowRight }} style={styles.arrowIcon} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
