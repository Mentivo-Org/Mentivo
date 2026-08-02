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
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DialogBox from '../../components/DialogBox';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { LoginEndpoints } from '../../constants/endpoint';
import { storage } from "../../services/storage";
import { useProfilePictureUpload } from '../../hooks/useProfilePictureUpload';
import ImageViewerModal from '../../components/ImageViewerModal';

const { width } = Dimensions.get("window");

import useSWR, { mutate } from 'swr';
import { Skeleton } from '../../components/Skeleton';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function StudentProfilePage() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  const { data: whoAmIData, error: loadError, isLoading } = useSWR(LoginEndpoints.whoAmI, fetcher, {
    revalidateOnFocus: true,
  });

  const userData = whoAmIData?.user;

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '' });
  
  // Image Viewer State
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  // Edit States
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const [tempGrade, setTempGrade] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  // Sync state variables when SWR fetches new data
  useEffect(() => {
    if (userData) {
      setTempName(userData.name || "");
      setTempGrade(userData.grade || "");
      storage.setItem("user", JSON.stringify(userData)).catch(err => console.error(err));
    }
  }, [userData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await mutate(LoginEndpoints.whoAmI);
    setRefreshing(false);
  };

  const { uploading, handlePickImage } = useProfilePictureUpload({
    onUploaded: async (newPhotoUrl) => {
      await mutate(LoginEndpoints.whoAmI); // Refetch profile
      await storage.setItem("photo_url", newPhotoUrl);
    },
    onSuccess: () => {
      setAlertData({ title: 'Success', message: 'Profile picture updated successfully' });
      setAlertVisible(true);
    },
    onError: () => {
      setAlertData({ title: 'Error', message: 'Failed to upload profile picture' });
      setAlertVisible(true);
    },
    onPermissionDenied: () => {
      setAlertData({ title: 'Permission Denied', message: 'We need camera roll permissions to change your profile picture.' });
      setAlertVisible(true);
    },
  });

  const handleUpdateProfile = async (field: 'name' | 'grade', val: string, setSaving: (v: boolean) => void, setIsEditing: (v: boolean) => void) => {
    setSaving(true);
    try {
      const body: any = {};
      body[field] = val;

      const response = await api.patch(LoginEndpoints.updateProfile, body);
      if (response.status === 200 && response.data?.user) {
        await mutate(LoginEndpoints.whoAmI); // Refetch profile
        setAlertData({ title: 'Success', message: `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully` });
        setAlertVisible(true);
        setIsEditing(false);
      }
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      setAlertData({ title: 'Error', message: `Failed to update ${field}` });
      setAlertVisible(true);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.bgContainer}>
          <View style={styles.ellipse18} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Skeleton style={{ width: 40, height: 40, borderRadius: 20 }} />
            <Skeleton style={{ width: 100, height: 24, borderRadius: 12, marginLeft: 20 }} />
          </View>
          <View style={styles.avatarSection}>
            <Skeleton style={{ width: 120, height: 120, borderRadius: 60 }} />
          </View>
          <View style={styles.nameSection}>
            <Skeleton style={{ width: 180, height: 28, borderRadius: 8, alignSelf: 'center', marginTop: 10 }} />
          </View>
          <View style={[styles.detailsContainer, { marginTop: 30 }]}>
            <Skeleton style={{ width: '100%', height: 60, borderRadius: 12, marginBottom: 15 }} />
            <Skeleton style={{ width: '100%', height: 60, borderRadius: 12, marginBottom: 15 }} />
            <Skeleton style={{ width: '100%', height: 60, borderRadius: 12 }} />
          </View>
        </ScrollView>
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
                  {savingName ? <ActivityIndicator size="small" color="#0077CB" /> : <Text style={styles.saveText}>Save</Text>}
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
          {/* Phone Row (Read-only for security reasons) */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{userData.phone || "Not provided"}</Text>
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
                    {savingGrade ? <ActivityIndicator size="small" color="#0077CB" /> : <Text style={styles.saveText}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.detailValue}>{userData.grade || "Not provided"}</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <ImageViewerModal
        visible={isViewerVisible}
        profilePic={profilePic}
        onClose={() => setIsViewerVisible(false)}
      />
      <DialogBox
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertVisible(false)}
      />
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
    color: '#0077CB', // Sleeves blue to match Mentivo
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
    backgroundColor: '#0077CB', 
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
    backgroundColor: '#0077CB',
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
    borderBottomColor: '#0077CB',
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
    borderBottomColor: '#0077CB',
    fontSize: 16,
    color: '#444653',
    paddingVertical: 4,
  },
  editInputContainer: {
    marginTop: 4,
  },
  editLink: {
    fontSize: 12,
    color: '#0077CB',
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
    color: '#0077CB',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#444653',
    marginBottom: 20,
  },
  backBtnFallback: {
    backgroundColor: '#0077CB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
