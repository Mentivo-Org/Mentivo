import React, { useState } from 'react';
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
             <Image source={require('../app-assets/logo.svg')} style={styles.logo} />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a password reset code</Text>

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
        </ScrollView>
      </KeyboardAvoidingView>
      <DialogBox 
        visible={alertVisible} 
        onClose={() => setAlertVisible(false)} 
        title={alertData.title} 
        message={alertData.message}
      />
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
    lineHeight: 22,
  },
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
    color: '#00288e',
    fontWeight: '500',
  },
});

export default ForgotPassword;
