import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, RefreshControl, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DialogBox from '../../components/DialogBox';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from "../../services/retrieveKeys";
import api from '../../services/api';
import { MentorEndpoints, ProfilePictureEndpoints } from '../../constants/endpoint';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';
import useSWR, { mutate } from 'swr';
import { Skeleton } from '../../components/Skeleton';

const { width, height } = Dimensions.get("window");

const getLevelIcon = (lvl?: string) => {
  const normLvl = lvl?.toLowerCase();
  if (normLvl === 'verified') return require('../../app-assets/level-verified.svg');
  if (normLvl === 'standard') return require('../../app-assets/level-standard.svg');
  if (normLvl === 'signature') return require('../../app-assets/level-signature.svg');
  if (normLvl === 'fellow') return require('../../app-assets/level-fellow.svg');
  return require('../../app-assets/verified-check.svg');
};

const getLevelColors = (lvl?: string) => {
  const normLvl = lvl?.toLowerCase();
  if (normLvl === 'standard') {
    return {
      headerBg: '#0077c8',
      headerText: '#ffffff',
      headerIconTint: '#ffffff',
    };
  }
  if (normLvl === 'signature') {
    return {
      headerBg: '#3b4b6b',
      headerText: '#ffffff',
      headerIconTint: '#ffffff',
    };
  }
  if (normLvl === 'fellow') {
    return {
      headerBg: '#0a192f',
      headerText: '#ffffff',
      headerIconTint: '#ffffff',
    };
  }
  // Default/Verified
  return {
    headerBg: '#D9D9D9',
    headerText: '#0077c8',
    headerIconTint: '#0077c8',
  };
};

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function MentorProfilePage() {
  const navigation = useNavigation<any>();
  const { handleLogout } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: statsData, error: profileError, isLoading } = useSWR(MentorEndpoints.getMeStats, fetcher);
  const mentorData = statsData?.profile;
  
  // Image Viewer State
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  // Edit State
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [tempUpi, setTempUpi] = useState("");
  const [savingUpi, setSavingUpi] = useState(false);

  const [isEditingYear, setIsEditingYear] = useState(false);
  const [tempYear, setTempYear] = useState("");
  const [savingYear, setSavingYear] = useState(false);

  const [isEditingExpertise, setIsEditingExpertise] = useState(false);
  const [tempExpertise, setTempExpertise] = useState("");
  const [savingExpertise, setSavingExpertise] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '' });

  // Sync state variables when SWR fetches new data
  useEffect(() => {
    if (mentorData) {
      setTempUpi(mentorData.upiId || "");
      setTempYear(mentorData.year ? mentorData.year.toString() : "");
      setTempExpertise(mentorData.expertise || "");
      AsyncStorage.setItem("stats", JSON.stringify(statsData)).catch(err => console.error(err));
    }
  }, [mentorData, statsData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await mutate(MentorEndpoints.getMeStats);
    setRefreshing(false);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setAlertData({ title: 'Permission Denied', message: 'We need camera roll permissions to change your profile picture.' });
      setAlertVisible(true);
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
        await mutate(MentorEndpoints.getMeStats); // Refetch profile
        setAlertData({ title: 'Success', message: 'Profile picture updated successfully' });
        setAlertVisible(true);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      setAlertData({ title: 'Error', message: 'Failed to upload profile picture' });
      setAlertVisible(true);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (field: 'upiId' | 'year' | 'expertise', val: string, setSaving: (v: boolean) => void, setIsEditing: (v: boolean) => void) => {
    setSaving(true);
    try {
      const body: any = {};
      body[field] = field === 'year' ? (val !== '' ? parseInt(val) : null) : val;

      const response = await api.patch(MentorEndpoints.updateProfile, body);
      if (response.status === 200) {
        let label = field === 'upiId' ? 'UPI ID' : field.charAt(0).toUpperCase() + field.slice(1);
        setAlertData({ title: 'Success', message: `${label} updated successfully` });
        setAlertVisible(true);
        await mutate(MentorEndpoints.getMeStats); // Refetch profile
        setIsEditing(false);
      }
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      let label = field === 'upiId' ? 'UPI ID' : field;
      setAlertData({ title: 'Error', message: `Failed to update ${label}` });
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

  if (!mentorData) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Failed to load profile.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.logoutButtonFallback}>
          <Text style={styles.logoutButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const profilePic = mentorData.user?.photo_url || require('../../app-assets/profile-circle.svg');

  const colors = getLevelColors(mentorData.mentorlevel);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background Ellipse matching Group 52 */}
      <View style={styles.bgContainer}>
        <View style={[styles.ellipse18, { backgroundColor: colors.headerBg }]} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Image 
              source={require('../../app-assets/arrow-back-up.svg')} 
              style={styles.backIcon} 
              tintColor={colors.headerIconTint} 
            />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
             <Image 
               source={require('../../app-assets/logo.svg')} 
               style={styles.logoIcon} 
               tintColor={colors.headerIconTint} 
             />
             <Text style={[styles.logoText, { color: colors.headerText }]}>entivo</Text>
          </View>
        </View>

        <AvatarSection
          profilePic={profilePic}
          uploading={uploading}
          onPressAvatar={() => setIsViewerVisible(true)}
          onPressEdit={handlePickImage}
        />

        {/* Name & Title */}
        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Image source={getLevelIcon(mentorData.mentorlevel)} style={styles.verifiedIcon} />
            <Text style={styles.nameText}>{mentorData.user?.name?.toUpperCase() || "MENTOR"}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{mentorData.mentorlevel?.toUpperCase() || "VERIFIED"} MENTOR</Text>
          </View>
        </View>

        <DetailsSection
          mentorData={mentorData}
          isEditingUpi={isEditingUpi}
          tempUpi={tempUpi}
          savingUpi={savingUpi}
          onChangeUpi={setTempUpi}
          onStartEditUpi={() => setIsEditingUpi(true)}
          onCancelEditUpi={() => { setIsEditingUpi(false); setTempUpi(mentorData.upiId || ""); }}
          onSaveUpi={() => handleUpdateProfile('upiId', tempUpi, setSavingUpi, setIsEditingUpi)}
          isEditingYear={isEditingYear}
          tempYear={tempYear}
          savingYear={savingYear}
          onChangeYear={setTempYear}
          onStartEditYear={() => setIsEditingYear(true)}
          onCancelEditYear={() => { setIsEditingYear(false); setTempYear(mentorData.year ? mentorData.year.toString() : ""); }}
          onSaveYear={() => handleUpdateProfile('year', tempYear, setSavingYear, setIsEditingYear)}
          isEditingExpertise={isEditingExpertise}
          tempExpertise={tempExpertise}
          savingExpertise={savingExpertise}
          onChangeExpertise={setTempExpertise}
          onStartEditExpertise={() => setIsEditingExpertise(true)}
          onCancelEditExpertise={() => { setIsEditingExpertise(false); setTempExpertise(mentorData.expertise || ""); }}
          onSaveExpertise={() => handleUpdateProfile('expertise', tempExpertise, setSavingExpertise, setIsEditingExpertise)}
        />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

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

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

interface AvatarSectionProps {
  profilePic: any;
  uploading: boolean;
  onPressAvatar: () => void;
  onPressEdit: () => void;
}

function AvatarSection({ profilePic, uploading, onPressAvatar, onPressEdit }: AvatarSectionProps) {
  return (
    <View style={styles.avatarSection}>
      <View style={styles.avatarWrapper}>
        <TouchableOpacity activeOpacity={0.8} onPress={onPressAvatar}>
          <Image source={profilePic} style={styles.avatar} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.editBadge} 
          onPress={onPressEdit}
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
  );
}

interface DetailsSectionProps {
  mentorData: any;
  isEditingUpi: boolean;
  tempUpi: string;
  savingUpi: boolean;
  onChangeUpi: (val: string) => void;
  onStartEditUpi: () => void;
  onCancelEditUpi: () => void;
  onSaveUpi: () => void;
  isEditingYear: boolean;
  tempYear: string;
  savingYear: boolean;
  onChangeYear: (val: string) => void;
  onStartEditYear: () => void;
  onCancelEditYear: () => void;
  onSaveYear: () => void;
  isEditingExpertise: boolean;
  tempExpertise: string;
  savingExpertise: boolean;
  onChangeExpertise: (val: string) => void;
  onStartEditExpertise: () => void;
  onCancelEditExpertise: () => void;
  onSaveExpertise: () => void;
}

function DetailsSection({
  mentorData,
  isEditingUpi,
  tempUpi,
  savingUpi,
  onChangeUpi,
  onStartEditUpi,
  onCancelEditUpi,
  onSaveUpi,
  isEditingYear,
  tempYear,
  savingYear,
  onChangeYear,
  onStartEditYear,
  onCancelEditYear,
  onSaveYear,
  isEditingExpertise,
  tempExpertise,
  savingExpertise,
  onChangeExpertise,
  onStartEditExpertise,
  onCancelEditExpertise,
  onSaveExpertise,
}: DetailsSectionProps) {
  return (
    <View style={styles.detailsContainer}>
      <DetailRow label="Phone" value={mentorData.user?.phone || "Not provided"} />
      <DetailRow label="E-mail" value={mentorData.user?.email || "Not provided"} />
      <DetailRow label="University Name" value={mentorData.iit_name || "Not provided"} />
      
      {/* Current Year Row */}
      <View style={styles.detailRow}>
        <View style={styles.detailLabelRow}>
          <Text style={styles.detailLabel}>Current Year</Text>
          {!isEditingYear && (
            <TouchableOpacity onPress={onStartEditYear}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isEditingYear ? (
          <View style={styles.editInputContainer}>
            <TextInput
              style={styles.upiInput}
              value={tempYear}
              onChangeText={onChangeYear}
              placeholder="Enter current year (e.g. 1, 2, 3, 4)"
              keyboardType="number-pad"
            />
            <View style={styles.editActions}>
              <TouchableOpacity onPress={onCancelEditYear} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSaveYear} disabled={savingYear} style={styles.saveBtn}>
                {savingYear ? <ActivityIndicator size="small" color="#0077c8" /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.detailValue}>{mentorData.year ? mentorData.year.toString() : "Not provided"}</Text>
        )}
      </View>

      <DetailRow label="Branch" value={mentorData.branch || "Not provided"} />
      
      {/* Expertise Row */}
      <View style={styles.detailRow}>
        <View style={styles.detailLabelRow}>
          <Text style={styles.detailLabel}>Expertise</Text>
          {!isEditingExpertise && (
            <TouchableOpacity onPress={onStartEditExpertise}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isEditingExpertise ? (
          <View style={styles.editInputContainer}>
            <TextInput
              style={styles.upiInput}
              value={tempExpertise}
              onChangeText={onChangeExpertise}
              placeholder="Enter expertise (e.g. Math, Physics)"
            />
            <View style={styles.editActions}>
              <TouchableOpacity onPress={onCancelEditExpertise} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSaveExpertise} disabled={savingExpertise} style={styles.saveBtn}>
                {savingExpertise ? <ActivityIndicator size="small" color="#0077c8" /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.detailValue}>{mentorData.expertise || "Not provided"}</Text>
        )}
      </View>
      
      {/* UPI ID Row */}
      <View style={styles.detailRow}>
        <View style={styles.detailLabelRow}>
          <Text style={styles.detailLabel}>UPI ID</Text>
          {!isEditingUpi && (
            <TouchableOpacity onPress={onStartEditUpi}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isEditingUpi ? (
          <View style={styles.editInputContainer}>
            <TextInput
              style={styles.upiInput}
              value={tempUpi}
              onChangeText={onChangeUpi}
              placeholder="Enter UPI ID"
              autoCapitalize="none"
            />
            <View style={styles.editActions}>
              <TouchableOpacity onPress={onCancelEditUpi} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSaveUpi} disabled={savingUpi} style={styles.saveBtn}>
                {savingUpi ? <ActivityIndicator size="small" color="#0077c8" /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.detailValue}>{mentorData.upiId || "Not provided"}</Text>
        )}
      </View>
    </View>
  );
}

interface ImageViewerModalProps {
  visible: boolean;
  profilePic: any;
  onClose: () => void;
}

function ImageViewerModal({ visible, profilePic, onClose }: ImageViewerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.viewerContainer}>
        <TouchableOpacity 
          style={styles.viewerOverlay} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        <View style={styles.viewerContent}>
          <Image 
            source={profilePic} 
            style={styles.fullImage} 
            contentFit="contain"
          />
          <TouchableOpacity 
            style={styles.closeViewerBtn} 
            onPress={onClose}
          >
            <Image source={require("../../app-assets/x-icon.svg")} style={styles.closeIcon} tintColor="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    top: -350, 
    left: '-15%', 
    width: '130%',
    height: 570,
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
    fontSize: 22,
    fontWeight: 400,
    color: '#444653',
    marginLeft: 2,
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
    backgroundColor: '#0077c8', 
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
    backgroundColor: '#0077c8',
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
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedIcon: {
    width: 14,
    height: 14,
    marginRight: 9,
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444653',
    letterSpacing: 0.5,
  },
  levelBadge: {
    alignItems: 'center',
  },
  levelText: {
    fontSize: 16,
    color: '#444653',
    fontWeight: '400',
    letterSpacing: 0.5,
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
  editLink: {
    fontSize: 12,
    color: '#0077c8',
    fontWeight: 'bold',
  },
  editInputContainer: {
    marginTop: 4,
  },
  upiInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#0077c8',
    fontSize: 16,
    color: '#444653',
    paddingVertical: 4,
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
    color: '#0077c8',
    fontWeight: 'bold',
  },
  logoutButton: {
      alignSelf: 'center',
      marginTop: 20,
      padding: 10,
  },
  logoutText: {
      color: '#ef4444',
      fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#444653',
    marginBottom: 20,
  },
  logoutButtonFallback: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutButtonText: {
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
