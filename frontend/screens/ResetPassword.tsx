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
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLoading } from '../context/LoadingContext';
import DialogBox from '../components/DialogBox';
import { ForgotPassEndpoints } from '../constants/endpoint';
import api from '../services/api';

const ResetPassword = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {accessToken, role} = route.params;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { showLoading, hideLoading } = useLoading();
  const [alertData, setAlertData] = useState({ title: '', message: '' });
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setAlertData({ title: 'Error', message: 'Please fill in both fields' });
      setAlertVisible(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlertData({ title: 'Error', message: 'Passwords do not match' });
      setAlertVisible(true);
      return;
    }

    if (newPassword.length < 8) {
      setAlertData({ title: 'Error', message: 'Password must be at least 8 characters' });
      setAlertVisible(true);
      return;
    }

    showLoading("Resetting password...");
    console.log("Access Token",accessToken)
    try {
      const response = await api.post(ForgotPassEndpoints.resetPass, {accessToken, newPassword});
      if(response.status===200) {
        setAlertData({ 
          title: 'Success', 
          message: "Password updated successfully. Please log in." 
        });
        setAlertVisible(true);
        setInterval(() => {
          setAlertVisible(false);
          navigation.replace(role==="mentor"?"MentorLoginPage":"StudentLoginPage")
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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Create a new secure password for your account</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={styles.passwordInput} 
                  placeholder="••••••••" 
                  secureTextEntry={!showNewPassword}
                  placeholderTextColor="rgba(68,70,83,0.5)"
                  onChangeText={(text)=>setNewPassword(text)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showNewPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#2563eb"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={styles.passwordInput} 
                  placeholder="••••••••" 
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="rgba(68,70,83,0.5)"
                  onChangeText={(text)=>setConfirmPassword(text)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#2563eb"
                  />
                </TouchableOpacity>
              </View>
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#0b1c30',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c4c5d5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#0b1c30',
  },
  eyeButton: {
    marginLeft: 10,
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
