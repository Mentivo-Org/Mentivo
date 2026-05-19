import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const imgPhoneIcon = "https://www.figma.com/api/mcp/asset/c6c243ef-5f4f-4dbd-8460-93c157649c9d";
const imgArrowRight = "https://www.figma.com/api/mcp/asset/52d1a7f3-0c6f-43e4-bab1-8076ae5b8c7e";

const CompleteProfile = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { role } = route.params || { role: 'student' };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    grade: '',
    college: '',
    year: '',
    branch: '',
    expertise: '',
  });

  const isMentor = role === 'mentor';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image source={require('../logo.svg')} style={styles.logo} />
          </View>

          <View style={styles.topSection}>
            <Text style={styles.mainTitle}>One last step</Text>
            <Text style={styles.mainSubtitle}>Finish setting up your account to start connecting with mentors.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.disabledInput} 
                value="John Doe" 
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{isMentor ? 'College Email Address' : 'Email Address'}</Text>
              <TextInput 
                style={styles.disabledInput} 
                value="john.doe@example.com" 
                editable={false}
              />
            </View>

            {isMentor && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>College Name</Text>
                  <TextInput 
                    style={styles.disabledInput} 
                    value="IITH" 
                    editable={false}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current year</Text>
                  <TextInput 
                    style={styles.disabledInput} 
                    value="3" 
                    editable={false}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Branch</Text>
                  <TextInput 
                    style={styles.disabledInput} 
                    value="CST" 
                    editable={false}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Expertise</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Best in Organic Chemistry" 
                    placeholderTextColor="#757684"
                  />
                </View>
              </>
            )}

            {!isMentor && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Grade</Text>
                <TextInput 
                  style={styles.disabledInput} 
                  value="11" 
                  editable={false}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: '#0b1c30' }]}>Phone Number</Text>
                <Text style={styles.required}>* Required</Text>
              </View>
              <View style={styles.phoneInputContainer}>
                <Image source={{ uri: imgPhoneIcon }} style={styles.phoneIcon} />
                <TextInput 
                  style={styles.phoneInput} 
                  placeholder="+91 00000 00000" 
                  placeholderTextColor="#6b7280"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {isMentor && (
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: '#0b1c30' }]}>Attach Your University Id Card</Text>
                  <Text style={styles.required}>* Required</Text>
                </View>
                <TouchableOpacity style={styles.uploadButton}>
                  <Text style={styles.uploadText}>.png, .jpg, .pdf</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.submitText}>Complete User Profile</Text>
              <Image source={{ uri: imgArrowRight }} style={styles.arrowIcon} />
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  container: {
    paddingHorizontal: 36,
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
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#0b1c30',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.32,
  },
  mainSubtitle: {
    fontSize: 16,
    color: '#444653',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 23,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444653',
  },
  required: {
    fontSize: 12,
    color: '#00288e',
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#c4c5d5',
    borderRadius: 8,
    paddingHorizontal: 17,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0b1c30',
  },
  disabledInput: {
    backgroundColor: '#eff4ff',
    borderWidth: 1,
    borderColor: '#c4c5d5',
    borderRadius: 8,
    paddingHorizontal: 17,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0b1c30',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#757684',
    borderRadius: 8,
    paddingLeft: 16,
  },
  phoneIcon: {
    width: 15,
    height: 15,
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0b1c30',
  },
  uploadButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#757684',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 17,
  },
  uploadText: {
    fontSize: 16,
    color: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
  submitText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    marginRight: 8,
  },
  arrowIcon: {
    width: 8,
    height: 12,
  },
});

export default CompleteProfile;
