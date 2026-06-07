import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from "../../services/retrieveKeys";
import api from '../../services/api';
import { MentorEndpoints } from '../../constants/endpoint';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get("window");

export default function MentorProfilePage() {
  const navigation = useNavigation<any>();
  const { handleLogout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mentorData, setMentorData] = useState<any>(null);

  const loadCachedData = async () => {
    try {
      const cachedStats = await AsyncStorage.getItem("stats");
      if (cachedStats) {
        const parsedData = JSON.parse(cachedStats);
        setMentorData(parsedData.profile);
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load cached profile", err);
    }
  };

  const fetchData = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await api.get(MentorEndpoints.getMeStats);
      if (response.status === 200) {
        const newData = response.data;
        setMentorData(newData.profile);
        await AsyncStorage.setItem("stats", JSON.stringify(newData));
      }
    } catch (error) {
      console.error("Failed to fetch mentor profile:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCachedData();
    fetchData(true); // Background fetch on mount
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData(true); // Background fetch on focus
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

      const response = await api.post(MentorEndpoints.uploadProfilePicture, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background Ellipse matching Group 52 */}
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
          <TouchableOpacity 
            style={styles.avatarWrapper} 
            onPress={handlePickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Image 
                  source={mentorData.photo_url || require('../../app-assets/avatar-placeholder.svg')} 
                  style={styles.avatar} 
                />
                <View style={styles.editBadge}>
                    <Image source={require("../../app-assets/edit-icon.svg")} style={styles.editBadgeIcon} tintColor="white" />
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Name & Title */}
        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Image source={require('../../app-assets/verified-check.svg')} style={styles.verifiedIcon} />
            <Text style={styles.nameText}>{mentorData.user?.name?.toUpperCase() || "MENTOR"}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{mentorData.mentorlevel?.toUpperCase() || "VERIFIED"} MENTOR</Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsContainer}>
          <DetailRow label="Phone" value={mentorData.user?.phone || "Not provided"} />
          <DetailRow label="E-mail" value={mentorData.user?.email || "Not provided"} />
          <DetailRow label="University Name" value={mentorData.iit_name || "Not provided"} />
          <DetailRow label="Current Year" value={mentorData.year ? mentorData.year.toString() : "Not provided"} />
          <DetailRow label="Branch" value={mentorData.branch || "Not provided"} />
          <DetailRow label="Expertise" value={mentorData.expertise || "Not provided"} />
          <DetailRow label="UPI ID" value={mentorData.upiId || "Not provided"} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

      </ScrollView>
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
    left: -91, 
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
    width: 13,
    height: 14,
  },
  logoText: {
    fontSize: 12,
    fontWeight: 'bold',
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
    backgroundColor: '#2563eb', 
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
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
  detailValue: {
    fontSize: 16,
    color: '#444653',
    fontWeight: '400',
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
});
