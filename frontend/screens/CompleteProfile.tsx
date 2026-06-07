import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import api from '../services/api';
import { LoginEndpoints } from '../constants/endpoint';
import DialogBox from '../components/DialogBox';
import { useLoading } from '../context/LoadingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../services/retrieveKeys';
const CompleteProfile = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {showLoading, hideLoading} = useLoading();
  const { full_name, email, role, phone, iit, state } = route.params;

  const [alertData, setAlertData] = useState({title: '', message: ''});
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  const {setIsSignedIn, handleLogout, requestNotificationPermissions} = useAuth();

  const handleStartFresh = async () => {
    await handleLogout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Landing' }],
    });
  };

  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    phone: '',
    grade: '',
    college: '',
    year: '',
    branch: '',
    expertise: '',
    idCard: null,
  });

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'application/pdf'],
      });

      if (!result.canceled) {
        setFormData((prev: any) => ({ ...prev, idCard: result.assets[0] }));
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const isMentor = role === 'mentor';

  // setFormData((prev) => ({...prev, phone: phone?phone:'', email, name: full_name}))

  const handleCompletion = async () => {
    if(isMentor) await mentorComplete()
    else await studentComplete();
  };

  const mentorComplete = async () => {
    console.log(formData);
    if(!formData.year || !formData.branch || !formData.expertise || !formData.idCard || (formData.phone==='' && !phone)) {
      setAlertData({title: 'Error', message: 'Please fill all the required fields and attach your ID card'});
      setAlertVisible(true);
      return;
    }

    showLoading("Onboarding your account...");
    try {
      const data = new FormData();
      data.append('name', full_name);
      data.append('email', email);
      data.append('phone', phone || formData.phone);
      data.append('college', formData.college);
      data.append('year', formData.year);
      data.append('branch', formData.branch);
      data.append('expertise', formData.expertise);
      
      if (formData.idCard) {
        data.append('idCard', {
          uri: formData.idCard.uri,
          name: formData.idCard.name,
          type: formData.idCard.mimeType || 'application/octet-stream',
        } as any);
      }

      const response = await api.post(LoginEndpoints.completeProfileMentor, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if(response.status !== 201) {
        setAlertData({title: 'Error in completing profile', message: response.data.error});
        setAlertVisible(true);
      } else {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        requestNotificationPermissions();
        setIsSignedIn(true);
      }
    } catch(err: any) {
      setAlertData({title: 'Error', message: err.message || 'Something went wrong'});
      setAlertVisible(true);
    } finally {
      hideLoading();
    }
  }

  const studentComplete = async () => {
    
    if(formData.grade==='' || formData.phone==='') {
      setAlertData({title: 'Error', message: 'Please fill all the required fields'});
      setAlertVisible(true);
      return;
    }
    
    showLoading("Onboarding your account...");
    try {
      var response;
      if(phone) {
        response = await api.post(LoginEndpoints.completeProfileStudent, {...formData, phone, name: full_name, email});
      }
      else {
        response = await api.post(LoginEndpoints.completeProfileStudent, {...formData, name: full_name, email});
      }
      if(response.status!==201) {
        setAlertData({title: 'Error in completing profile', message: response.data.error});
        setAlertVisible(true);
      }
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      requestNotificationPermissions();
      setIsSignedIn(true);
    }
    catch(err) {
      setAlertData({title: 'Error', message: err});
      setAlertVisible(true);
    }
    finally {
      hideLoading();
    }
    
  }

  useEffect(()=> {
    if(isMentor) {
      setFormData((prev)=> ({...prev, phone, name: full_name, email, college: iit}))
    }
    else {
      setFormData((prev)=> ({...prev, phone, name: full_name, email}))
    }

    if(state==='loaded') {
      setAlertData({title: "Success", message: "Successfully loaded data from previous session"});
      setAlertVisible(true);
    }

  },[])

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'android' ? 70 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.container} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image source={require('../app-assets/logo.svg')} style={styles.logo} />
            <TouchableOpacity 
              style={styles.startFreshButton}
              onPress={handleStartFresh}
            >
              <Text style={styles.startFreshText}>Start fresh</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.topSection}>
            <Text style={styles.mainTitle}>One last step</Text>
            <Text style={styles.mainSubtitle}>Finish setting up your account to start connecting with {isMentor?'students': 'mentors'}.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput 
                style={styles.disabledInput} 
                value={full_name} 
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{isMentor ? 'College Email Address' : 'Email Address'}</Text>
              <TextInput 
                style={styles.disabledInput} 
                value={email} 
                editable={false}
              />
            </View>

            {isMentor && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>College Name</Text>
                  <TextInput 
                    style={styles.disabledInput} 
                    value={formData.college}
                    editable={false}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current year</Text>
                  <TextInput 
                    style={styles.input} 
                    onChangeText={(text) => setFormData((prev) => ({...prev, year: text}))}
                    keyboardType='phone-pad'
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Branch</Text>
                  <TextInput 
                    style={styles.input} 
                    onChangeText={(text) => setFormData((prev) => ({...prev, branch: text}))}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Expertise</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Best in Organic Chemistry" 
                    placeholderTextColor="#757684"
                    onChangeText={(text) => setFormData((prev) => ({...prev, expertise: text}))}
                  />
                </View>
              </>
            )}

            {!isMentor && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Grade</Text>
                <TouchableOpacity 
                  style={styles.dropdownSelector} 
                  onPress={() => setGradeModalVisible(true)}
                >
                  <Text style={formData.grade ? styles.dropdownText : styles.dropdownPlaceholder}>
                    {formData.grade ? (formData.grade === 'Dropper' ? 'Dropper' : `Class ${formData.grade}`) : 'Select your grade'}
                  </Text>
                  <Image 
                    source={require('../app-assets/arrow-right.svg')} 
                    style={styles.dropdownArrow} 
                    tintColor="#757684"
                  />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: '#0b1c30' }]}>Phone Number</Text>
                <Text style={styles.required}>* Required</Text>
              </View>
              <View style={phone ? styles.phoneInputContainerDisabled : styles.phoneInputContainer}>
                <Image source={require('../app-assets/phone-input-icon.svg')} style={styles.phoneIcon} />
                <TextInput 
                  style={styles.phoneInput} 
                  placeholder="94123 54321" 
                  value={phone ? phone : formData.phone}
                  onChangeText={(text)=>setFormData((prev) => ({...prev, phone: text}))}
                  placeholderTextColor="#6b7280"
                  keyboardType="phone-pad"
                  editable={!phone}
                />
              </View>
            </View>

            {isMentor && (
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: '#0b1c30' }]}>Attach Your University Id Card</Text>
                  <Text style={styles.required}>* Required</Text>
                </View>
                <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                  <Text style={styles.uploadText}>
                    {formData.idCard ? formData.idCard.name : '.png, .jpg, .pdf'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={() => handleCompletion()}
            >
              <Text style={styles.submitText}>Complete User Profile</Text>
              <Image 
                source={require('../app-assets/arrow-right-white.svg')} 
                style={styles.arrowIcon} 
                tintColor="white"
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={gradeModalVisible} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setGradeModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Your Grade</Text>
            {['8', '9', '10', '11', '12', 'Dropper'].map((grade) => (
              <TouchableOpacity
                key={grade}
                style={[styles.modalOption, formData.grade === grade && styles.modalOptionSelected]}
                onPress={() => {
                  setFormData({...formData, grade});
                  setGradeModalVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, formData.grade === grade && styles.modalOptionTextSelected]}>
                  {grade === 'Dropper' ? 'Dropper' : `Class ${grade}`}
                </Text>
                {formData.grade === grade && (
                  <View style={styles.selectedDot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      <DialogBox visible={alertVisible} onClose={() => setAlertVisible(false)} title={alertData.title} message={alertData.message}/>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    position: 'relative',
    width: '100%',
  },
  startFreshButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    position: 'absolute',
    right: 0,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  startFreshText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  logo: {
    width: 36,
    height: 38,
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
    borderColor: '#c4c5d5',
    borderRadius: 8,
    paddingLeft: 16,
  },
  phoneInputContainerDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff4ff',
    borderWidth: 1,
    borderColor: '#c4c5d5',
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
  dropdownSelector: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#c4c5d5',
    borderRadius: 8,
    paddingHorizontal: 17,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    color: '#0b1c30',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#757684',
  },
  dropdownArrow: {
    width: 10,
    height: 6,
    transform: [{ rotate: '90deg' }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0b1c30',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  modalOptionSelected: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#4b5563',
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
});

export default CompleteProfile;
