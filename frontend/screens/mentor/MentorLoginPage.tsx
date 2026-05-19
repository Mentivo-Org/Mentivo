import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const imgIconstackIoBrandGoogle = "https://www.figma.com/api/mcp/asset/4e71d5f4-e460-4edd-a008-99e09ee7f96d";
const imgPhoneIcon = "https://www.figma.com/api/mcp/asset/fe9c9903-3895-406b-b868-ef794369f62e";

const MentorLoginPage = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
           <Image source={require('../../logo.svg')} style={styles.logo} />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Access expert guidance from the IIT community</Text>

          <TouchableOpacity style={styles.socialButton}>
            <Image source={{ uri: imgIconstackIoBrandGoogle }} style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => navigation.navigate('SendOtp', { role: 'mentor' })}
          >
            <Image source={{ uri: imgPhoneIcon }} style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>Sign in with Phone Number</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input} 
              placeholder="name@domain.com" 
              placeholderTextColor="#757684"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••" 
              placeholderTextColor="#757684"
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => navigation.navigate('SendOtp', { role: 'mentor' })}
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
      </ScrollView>
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
    width: 26,
    height: 28,
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
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c4c5d5',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
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
    backgroundColor: '#2563eb',
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
    color: '#00288e',
  },
});

export default MentorLoginPage;
