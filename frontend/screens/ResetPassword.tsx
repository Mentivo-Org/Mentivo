import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { authStyles } from '../styles/authStyles';
import { PasswordInput } from '../components/PasswordInput';
import { AuthLayout } from '../components/AuthLayout';
import { useLoading } from '../context/LoadingContext';
import DialogBox from '../components/DialogBox';
import { ForgotPassEndpoints } from '../constants/endpoint';
import api from '../services/api';

const ResetPassword = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {accessToken, role} = route.params;
  const newPasswordRef = useRef("");
  const confirmPasswordRef = useRef("");

  const handleNewPasswordChange = useCallback((t: string) => { newPasswordRef.current = t; }, []);
  const handleConfirmPasswordChange = useCallback((t: string) => { confirmPasswordRef.current = t; }, []);

  const { showLoading, hideLoading } = useLoading();
  const [alertData, setAlertData] = useState({ title: '', message: '' });
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  const handleResetPassword = async () => {
    if (!newPasswordRef.current || !confirmPasswordRef.current) {
      setAlertData({ title: 'Error', message: 'Please fill in both fields' });
      setAlertVisible(true);
      return;
    }

    if (newPasswordRef.current !== confirmPasswordRef.current) {
      setAlertData({ title: 'Error', message: 'Passwords do not match' });
      setAlertVisible(true);
      return;
    }

    if (newPasswordRef.current.length < 8) {
      setAlertData({ title: 'Error', message: 'Password must be at least 8 characters' });
      setAlertVisible(true);
      return;
    }

    showLoading("Resetting password...");
    console.log("Access Token",accessToken)
    try {
      const response = await api.post(ForgotPassEndpoints.resetPass, {accessToken, newPassword: newPasswordRef.current});
      if(response.status===200) {
        setAlertData({ 
          title: 'Success', 
          message: "Password updated successfully. Please log in." 
        });
        setAlertVisible(true);
        setTimeout(() => {
          setAlertVisible(false);
          navigation.replace(role==="mentor"?"MentorLoginPage":"StudentLogin")
        }, 1000);
      }
      else {
        setAlertData({title: "Error", message: response.data?.error});
        setAlertVisible(true);
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      const errorMsg = error.response?.data?.error || "Failed to reset password";
      setAlertData({ title: "Error", message: errorMsg });
      setAlertVisible(true);
    } finally {
      hideLoading();
    }
  };

  return (
    <AuthLayout>
      <View style={authStyles.card}>
        <Text style={authStyles.title}>Reset Password</Text>
        <Text style={authStyles.subtitle}>Create a new secure password for your account</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <PasswordInput 
            defaultValue=""
            onChangeText={handleNewPasswordChange}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <PasswordInput 
            defaultValue=""
            onChangeText={handleConfirmPasswordChange}
          />
        </View>

        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleResetPassword}
        >
          <Text style={styles.resetButtonText}>Reset Password</Text>
          <Image 
            source={require('../app-assets/arrow-right-white.svg')} 
            style={styles.arrowIcon} 
            tintColor="white"
          />
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#0b1c30',
    marginBottom: 8,
  },
  resetButton: {
    backgroundColor: '#2563eb',
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
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  arrowIcon: {
    width: 12,
    height: 12,
  },
});

export default ResetPassword;
