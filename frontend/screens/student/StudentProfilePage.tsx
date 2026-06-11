import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { LoginEndpoints, ProfilePictureEndpoints } from '../../constants/endpoint';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get("window");

export default function StudentProfilePage() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  // Image Viewer State
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  // Edit States
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const [tempGrade, setTempGrade] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  const loadCachedData = async () => {
    try {
      const cachedUser = await AsyncStorage.getItem("user");
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        setUserData(parsedUser);
        setTempName(parsedUser.name || "");
        setTempPhone(parsedUser.phone || "");
        setTempGrade(parsedUser.grade || "");
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load cached student profile", err);
    }
  };

  const fetchData = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await api.get(LoginEndpoints.whoAmI);
      if (response.status === 200 && response.data?.user) {
        const user = response.data.user;
        setUserData(user);
        setTempName(user.name || "");
        setTempPhone(user.phone || "");
        setTempGrade(user.grade || "");
        await AsyncStorage.setItem("user", JSON.stringify(user));
      }
    } catch (error) {
      console.error("Failed to fetch student profile:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCachedData();
    fetchData(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [])
  );

  const onRefresh = () => {
    fetchData();
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('profilePic', { uri, name: filename, type } as any);

      const response = await api.post(ProfilePictureEndpoints.uploadProfilePicture, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200 && response.data?.photo_url) {
        const newPhotoUrl = response.data.photo_url;
        const updatedUser = { ...userData, photo_url: newPhotoUrl };
        setUserData(updatedUser);
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        Alert.alert('Success', 'Profile picture updated successfully');
        fetchData(true);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (field: 'name' | 'phone' | 'grade', val: string, setSaving: (v: boolean) => void, setIsEditing: (v: boolean) => void) => {
    setSaving(true);
    try {
      const body: any = {};
      body[field] = val;

      const response = await api.patch(LoginEndpoints.updateProfile, body);
      if (response.status === 200 && response.data?.user) {
        const updatedUser = response.data.user;
        setUserData(updatedUser);
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        Alert.alert('Success', `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
        setIsEditing(false);
      }
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      Alert.alert('Error', `Failed to update ${field}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Failed to load profile.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnFallback}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const profilePic = userData.photo_url ? { uri: userData.photo_url } : require('../../app-assets/profile-circle.svg');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background Ellipse matching the Figma top background wave */}
      <View style={styles.bgContainer}>
        <View style={styles.ellipse18} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Image source={require('../../app-assets/arrow-back-up.svg')} style={styles.backIcon} tintColor="#444653" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
             <Image source={require('../../app-assets/logo.svg')} style={styles.logoIcon} />
             <Text style={styles.logoText}>entivo</Text>
          </View>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setIsViewerVisible(true)}
            >
              <Image 
                source={profilePic} 
                style={styles.avatar} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.editBadge} 
              onPress={handlePickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Image source={require("../../app-assets/edit-icon.svg")} style={styles.editBadgeIcon} tintColor="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Name Section (Centered) */}
        <View style={styles.nameSection}>
          {isEditingName ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                style={styles.nameInput}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Enter your name"
                autoCapitalize="words"
              />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => { setIsEditingName(false); setTempName(userData.name || ""); }} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleUpdateProfile('name', tempName, setSavingName, setIsEditingName)} disabled={savingName} style={styles.saveBtn}>
                  {savingName ? <ActivityIndicator size="small" color="#2563eb" /> : <Text style={styles.saveText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditingName(true)} style={styles.nameRow} activeOpacity={0.7}>
              <Text style={styles.nameText}>{userData.name?.toUpperCase() || "ADD NAME"}</Text>
              <Image source={require('../../app-assets/edit-icon.svg')} style={styles.editNameIcon} tintColor="#444653" />
            </TouchableOpacity>
          )}
        </View>

        {/* Details Section */}
        <View style={styles.detailsContainer}>
          {/* Phone Row */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              {!isEditingPhone && (
                <TouchableOpacity onPress={() => setIsEditingPhone(true)}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
            {isEditingPhone ? (
              <View style={styles.editInputContainer}>
                <TextInput
                  style={styles.detailInput}
                  value={tempPhone}
                  onChangeText={setTempPhone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={() => { setIsEditingPhone(false); setTempPhone(userData.phone || ""); }} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleUpdateProfile('phone', tempPhone, setSavingPhone, setIsEditingPhone)} disabled={savingPhone} style={styles.saveBtn}>
                    {savingPhone ? <ActivityIndicator size="small" color="#2563eb" /> : <Text style={styles.saveText}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.detailValue}>{userData.phone || "Not provided"}</Text>
            )}
          </View>

          {/* Email Row (Read-only for security / Firebase sync reasons) */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>E-mail</Text>
            <Text style={styles.detailValue}>{userData.email || "Not provided"}</Text>
          </View>

          {/* Current Grade Row */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <Text style={styles.detailLabel}>Current Grade</Text>
              {!isEditingGrade && (
                <TouchableOpacity onPress={() => setIsEditingGrade(true)}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
            {isEditingGrade ? (
              <View style={styles.editInputContainer}>
                <TextInput
                  style={styles.detailInput}
                  value={tempGrade}
                  onChangeText={setTempGrade}
                  placeholder="Enter current grade (e.g. 11, 12, 12+)"
                />
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={() => { setIsEditingGrade(false); setTempGrade(userData.grade || ""); }} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleUpdateProfile('grade', tempGrade, setSavingGrade, setIsEditingGrade)} disabled={savingGrade} style={styles.saveBtn}>
                    {savingGrade ? <ActivityIndicator size="small" color="#2563eb" /> : <Text style={styles.saveText}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.detailValue}>{userData.grade || "Not provided"}</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Profile Picture Viewer Modal */}
      <Modal
        visible={isViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsViewerVisible(false)}
      >
        <View style={styles.viewerContainer}>
          <TouchableOpacity 
            style={styles.viewerOverlay} 
            activeOpacity={1} 
            onPress={() => setIsViewerVisible(false)} 
          />
          <View style={styles.viewerContent}>
            <Image 
              source={profilePic} 
              style={styles.fullImage} 
              contentFit="contain"
            />
            <TouchableOpacity 
              style={styles.closeViewerBtn} 
              onPress={() => setIsViewerVisible(false)}
            >
              <Image source={require("../../app-assets/x-icon.svg")} style={styles.closeIcon} tintColor="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', 
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    overflow: 'hidden',
    zIndex: -1,
  },
  ellipse18: {
    position: 'absolute',
    top: -240, 
    left: (width - 573) / 2, 
    width: 573,
    height: 470,
    borderRadius: 286.5,
    backgroundColor: 'white', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  scrollContent: {
    paddingBottom: 100, 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconButton: {
    padding: 4,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 20,
    height: 21,
  },
  logoText: {
    fontSize: 16,
    marginLeft: 5,
    fontWeight: 'bold',
    color: '#1d459c', // Sleeves blue to match Mentivo
    letterSpacing: 0.5,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  avatarWrapper: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: '#2563eb', 
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  avatar: {
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: '#e2e8f0',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    backgroundColor: '#2563eb',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    zIndex: 10,
  },
  editBadgeIcon: {
    width: 16,
    height: 16,
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444653',
    letterSpacing: 0.5,
  },
  editNameIcon: {
    width: 16,
    height: 16,
  },
  nameEditContainer: {
    width: '100%',
  },
  nameInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#2563eb',
    fontSize: 18,
    color: '#444653',
    paddingVertical: 4,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  detailsContainer: {
    paddingHorizontal: 40,
    marginTop: 10,
  },
  detailRow: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 12,
    color: '#7e7e7e',
    marginBottom: 4,
    fontWeight: '400',
  },
  detailLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#444653',
    fontWeight: '400',
  },
  detailInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#2563eb',
    fontSize: 16,
    color: '#444653',
    paddingVertical: 4,
  },
  editInputContainer: {
    marginTop: 4,
  },
  editLink: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
  },
  cancelBtn: {
    padding: 4,
  },
  cancelText: {
    fontSize: 12,
    color: '#7e7e7e',
  },
  saveBtn: {
    padding: 4,
  },
  saveText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#444653',
    marginBottom: 20,
  },
  backBtnFallback: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  viewerContent: {
    width: width,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeViewerBtn: {
    position: 'absolute',
    top: -40,
    right: 20,
    padding: 10,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
});
