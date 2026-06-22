import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { authStyles } from '../styles/authStyles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { AuthLayout } from '../components/AuthLayout';
import api from '../services/api';
import { ForgotPassEndpoints } from '../constants/endpoint';
import { useLoading } from '../context/LoadingContext';
import DialogBox from '../components/DialogBox';

const ForgotPassword = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>()
  const {role} = route.params;
  const [email, setEmail] = useState("");
  const { showLoading, hideLoading } = useLoading();

  const [alertData, setAlertData] = useState({ title: '', message: '' });
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  const handleSendOtp = async () => {
    if (!email) {
      setAlertData({ title: 'Error', message: 'Please enter your email address' });
      setAlertVisible(true);
      return;
    }

    showLoading("Sending OTP...");
    try {
      const response = await api.post(ForgotPassEndpoints.forgotPass, { email, role: role });
      
      if (response.status === 200) {
        // Navigate to OTP verification for forgot password
        // Assuming we reuse SendOtp or have a specialized one. 
        // For now, let's assume we might need a reset password OTP screen or similar.
        // User just asked for the page with Send OTP button.
        setAlertData({ 
          title: 'Success', 
          message: 'If an account exists with this email, an OTP has been sent.' 
        });
        setAlertVisible(true);
        navigation.navigate('SendOtp', { email, forgotPass: true});
      }
      else {
        setAlertData({ title: "Error", message: response.data?.error });
        setAlertVisible(true);
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      const errorMsg = error.response?.data?.error || "Failed to initiate password reset";
      setAlertData({ title: "Error", message: errorMsg });
      setAlertVisible(true);
    } finally {
      hideLoading();
    }
  };

  return (
    <AuthLayout>
      <View style={authStyles.card}>
        <Text style={authStyles.title}>Forgot Password</Text>
        <Text style={authStyles.subtitle}>Enter your email to receive a password reset code</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
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

        <TouchableOpacity 
          style={styles.sendButton}
          onPress={handleSendOtp}
        >
          <Text style={styles.sendButtonText}>Send OTP</Text>
          <Image 
            source={require('../app-assets/arrow-right-white.svg')} 
            style={styles.arrowIcon} 
            tintColor="white"
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
      <DialogBox 
        visible={alertVisible} 
        onClose={() => setAlertVisible(false)} 
        title={alertData.title} 
        message={alertData.message}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#0b1c30',
    marginBottom: 8,
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
  sendButton: {
    backgroundColor: '#0077CB',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 1.75,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  arrowIcon: {
    width: 12,
    height: 12,
  },
  backButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#0077CB',
    fontWeight: '500',
  },
});

export default ForgotPassword;
