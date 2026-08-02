import React, { useState } from 'react';
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
import Ionicons from '@react-native-vector-icons/ionicons';
import { useLoading } from '../../context/LoadingContext';
import { AuthLayout } from '../../components/AuthLayout';
import DialogBox from '../../components/DialogBox';
import {isEmail} from 'validator'

const MentorSignupPage = () => {
  const navigation = useNavigation<any>();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [alertData, setAlertData] = useState({title:'', message: ''})

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
  const [alertVisible, setAlertVisible] = useState<boolean>(false);
  const {showLoading, hideLoading} = useLoading();

  const handleCreateAccount = async () => {
    if (!fullName || !email || !phone) {
      setAlertData({title: 'Error', message: 'Please fill in all the required fields'});
      setAlertVisible(true);
      return;
    }

    if(!isEmail(email)) {
      setAlertData({title: 'Invalid Email', message: 'Please check given email ID'});
      setAlertVisible(true);
      return;
    }

    
    if(Number(phone)<1000000000) {
      setAlertData({title: 'Invalid Phone Number', message: 'Please input a valid phone number'});
      setAlertVisible(true);
      return;
    }
    
    try {
      showLoading("Validating email ID...");
      const response = await api.post(LoginEndpoints.getIIT, {email});
      if(response.status!==200) {
        setAlertData({title: "Error fetching IIT Information", message: response.data?.error});
        setAlertVisible(true);
        return;
      }
    }
    catch(err) {
      setAlertData({title: "Error", message: err.response?.data?.error || "Invalid email ID"});
      setAlertVisible(true);
      return;
    }
    finally {
      hideLoading();
    }

    try {
      showLoading("Signing you up...");
      const response = await api.post(LoginEndpoints.signup, {
        email,
        name: fullName,
        phone: phone,
        role: "mentor"
      });

      const { data } = response;
      hideLoading();
      if (data.requiresVerification) {
        // const { accessToken, refreshToken, user } = data;
        // await AsyncStorage.setItem('accessToken', accessToken);
        // await AsyncStorage.setItem('refreshToken', refreshToken);
        // await AsyncStorage.setItem('user', JSON.stringify(user));
        // await AsyncStorage.setItem('verifiedEmail', 'false');

        navigation.navigate("SendOtp", { email: email, name: fullName, role: "mentor" , phone});
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

  return (
    <AuthLayout>
          <View style={styles.topSection}>
            <Text style={styles.mainTitle}>Create Account</Text>
            <Text style={styles.mainSubtitle}>Join the community of expert mentors and students</Text>
          </View>

          <View style={styles.card}>
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
                <Text style={styles.label}>College Email ID</Text>
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
              <TouchableOpacity onPress={() => navigation.navigate('MentorLogin')}>
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
      <DialogBox title={alertData.title} message={alertData.message} visible={alertVisible} onClose={()=> setAlertVisible(false)}/>
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
  },
  passwordInput: {
    flex: 1,
    fontSize: 17,
    color: '#0b1c30',
  },
  eyeButton: {
    marginLeft: 10,
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
});

export default MentorSignupPage;