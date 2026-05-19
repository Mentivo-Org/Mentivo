import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const imgIconstackIoBrandGoogle = "https://www.figma.com/api/mcp/asset/b00d40b7-c6d0-4270-be40-41602389a9f2";
const imgCheckCircle = "https://www.figma.com/api/mcp/asset/52d1a7f3-0c6f-43e4-bab1-8076ae5b8c7e";

const MentorSignupPage = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
           <Image source={require('../../logo.svg')} style={styles.logo} />
        </View>

        <View style={styles.topSection}>
          <Text style={styles.mainTitle}>Create Account</Text>
          <Text style={styles.mainSubtitle}>Join the community of expert mentors and students</Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.socialButton}>
            <Image source={{ uri: imgIconstackIoBrandGoogle }} style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>Sign up with Google</Text>
          </TouchableOpacity>

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
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input} 
              placeholder="name@domain.com" 
              placeholderTextColor="rgba(68,70,83,0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••" 
              placeholderTextColor="rgba(68,70,83,0.5)"
              secureTextEntry
            />
            <View style={styles.hintContainer}>
              <Image source={{ uri: imgCheckCircle }} style={styles.hintIcon} />
              <Text style={styles.hintText}>At least 8 characters</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('SendOtp', { role: 'mentor' })}
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
          <Text style={styles.legalText}>
            By clicking Create Account, you agree to our{' '}
            <Text style={styles.underline}>Terms of Service</Text> and{' '}
            <Text style={styles.underline}>Privacy Policy</Text>.
          </Text>
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
    marginBottom: 20,
  },
  logo: {
    width: 26,
    height: 28,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 20,
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
    backgroundColor: '#2563eb',
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
    color: '#2563eb',
  },
  legalFooter: {
    marginTop: 24,
    paddingHorizontal: 10,
  },
  legalText: {
    fontSize: 12,
    color: '#444653',
    textAlign: 'center',
    lineHeight: 20,
  },
  underline: {
    textDecorationLine: 'underline',
  },
});

export default MentorSignupPage;
