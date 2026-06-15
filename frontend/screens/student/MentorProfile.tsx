import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DialogBox from '../../components/DialogBox';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../services/api';
import { MentorEndpoints, CallEndpoints } from '../../constants/endpoint';
import { useLoading } from '../../context/LoadingContext';
import { requestMicrophonePermission } from '../../services/permissions';
import { chatSessionManager } from '../../services/chat/chatSessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get("window");


export default function MentorProfile() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showLoading, hideLoading } = useLoading();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '' });
  
  // Extract mentor data from params, with fallbacks
  const passedMentor = route.params?.mentor || {};
  
  const [isFavorite, setIsFavorite] = useState(passedMentor.isFavorite || false);
  const [isInitiating, setIsInitiating] = useState(false);

  const mentor = {
    id: passedMentor.id || route.params?.mentorId,
    name: passedMentor.name || 'Unknown Mentor',
    iit: passedMentor.iit || 'Unknown IIT',
    branch: passedMentor.branch || 'Unknown Branch',
    year: passedMentor.year || '',
    rating: passedMentor.rating || 0,
    reviews: passedMentor.reviews || 0,
    sessions: passedMentor.calls || 0,
    price: passedMentor.price || 10,
    originalPrice: passedMentor.originalPrice || null,
    isOnline: passedMentor.isOnline || false,
    bio: passedMentor.bio || 'Available for mentoring sessions.',
    photoUrl: passedMentor.photoUrl || passedMentor.photo_url,
    mentorlevel: passedMentor.mentorlevel,
  };

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const storedFavs = await AsyncStorage.getItem('favouriteMentors');
        if (storedFavs) {
          const favs: string[] = JSON.parse(storedFavs);
          if (mentor.id) {
            setIsFavorite(favs.includes(mentor.id));
          }
        }
      } catch (error) {
        console.error('Error reading favorites from AsyncStorage:', error);
      }
    };
    checkFavoriteStatus();
  }, [mentor.id]);

  const toggleFavorite = async () => {
    const originalStatus = isFavorite;
    try {
      const newStatus = !isFavorite;
      setIsFavorite(newStatus);
      
      // Update AsyncStorage
      const storedFavs = await AsyncStorage.getItem('favouriteMentors');
      let favs: string[] = storedFavs ? JSON.parse(storedFavs) : [];
      if (newStatus) {
        if (!favs.includes(mentor.id)) {
          favs.push(mentor.id);
        }
      } else {
        favs = favs.filter(id => id !== mentor.id);
      }
      await AsyncStorage.setItem('favouriteMentors', JSON.stringify(favs));
      
      await api.post(`${MentorEndpoints.toggleFavoriteMentor}${mentor.id}/favorite`);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert state if API fails
      setIsFavorite(originalStatus);
      
      // Revert AsyncStorage
      const storedFavs = await AsyncStorage.getItem('favouriteMentors');
      let favs: string[] = storedFavs ? JSON.parse(storedFavs) : [];
      if (originalStatus) {
        if (!favs.includes(mentor.id)) {
          favs.push(mentor.id);
        }
      } else {
        favs = favs.filter(id => id !== mentor.id);
      }
      await AsyncStorage.setItem('favouriteMentors', JSON.stringify(favs));
    }
  };

  const handleCallNow = async () => {
    if (!mentor.isOnline) {
      setAlertData({ title: 'Mentor Offline', message: 'This mentor is currently offline. You can schedule a call instead.' });
      setAlertVisible(true);
      return;
    }

    // Check permissions
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setAlertData({ title: 'Permission Denied', message: 'Microphone access is required for voice calls. Please enable it in your device settings.' });
      setAlertVisible(true);
      return;
    }

    setIsInitiating(true);
    showLoading('Initiating call...');
    try {
      const response = await api.post(CallEndpoints.initiate, { mentorId: mentor.id });
      
      if (response.status === 200) {
        const { sessionId, channelName, studentToken, maxDurationSeconds, mentorPhoto, chatSessionId } = response.data;
        
        navigation.navigate('InCall', {
          callId: sessionId,
          channelName,
          callerName: mentor.name,
          role: 'caller',
          initialToken: studentToken,
          maxDuration: maxDurationSeconds,
          mentorPhoto: mentorPhoto || mentor.photoUrl,
          chatSessionId
        });
      }
    } catch (error: any) {
      console.error('Failed to initiate call:', error);
      const errorMsg = error.response?.data?.error || 'Failed to connect. Please try again.';
      setAlertData({ title: 'Call Error', message: errorMsg });
      setAlertVisible(true);
    } finally {
      setIsInitiating(false);
      hideLoading();
    }
  };

  const handleChat = async () => {
    showLoading('Starting chat...');
    try {
      const session = await chatSessionManager.createSession(mentor.id);
      navigation.navigate('ChatPage', {
        partnerId: mentor.id,
        partnerName: mentor.name,
        sessionId: session.id,
        partnerPhotoUrl: mentor.photoUrl || null
      });
    } catch (error: any) {
      console.error('Failed to start chat:', error);
      const errorMsg = error.response?.data?.error || 'Failed to start chat. Please try again.';
      setAlertData({ title: 'Chat Error', message: errorMsg });
      setAlertVisible(true);
    } finally {
      hideLoading();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../../app-assets/arrow-back-up.svg')} style={styles.backIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.topInfo}>
          <AvatarContainer
            photoUrl={mentor.photoUrl}
            isOnline={mentor.isOnline}
            mentorlevel={mentor.mentorlevel}
          />
          
          <View style={styles.nameSection}>
            <Text style={styles.name}>{mentor.name}</Text>
            <Text style={styles.iitText}>{mentor.iit}</Text>
            <Text style={styles.branchText}>{mentor.branch} {mentor.year}</Text>
          </View>

          <View style={styles.priceTag}>
            {mentor.originalPrice && mentor.originalPrice > mentor.price ? (
              <Text style={styles.originalPriceText}>₹{mentor.originalPrice}/min</Text>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={styles.priceAmount}>₹{mentor.price}</Text>
              <Text style={styles.priceUnit}>/min</Text>
            </View>
          </View>
        </View>

        <StatsRow
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
          sessions={mentor.sessions}
          rating={mentor.rating}
          reviews={mentor.reviews}
        />

        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>{mentor.bio}</Text>
        </View>

        <ActionButtons
          isOnline={mentor.isOnline}
          isInitiating={isInitiating}
          onCall={handleCallNow}
          onChat={handleChat}
          onSchedule={() => navigation.navigate('ScheduleCall', { 
            mentorName: mentor.name,
            mentorId: mentor.id 
          })}
        />
      </View>
      <DialogBox
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

interface AvatarContainerProps {
  photoUrl: string;
  isOnline: boolean;
  mentorlevel?: string;
}

const getLevelIcon = (lvl?: string) => {
  const normLvl = lvl?.toLowerCase();
  if (normLvl === 'verified') return require('../../app-assets/level-verified.svg');
  if (normLvl === 'standard') return require('../../app-assets/level-standard.svg');
  if (normLvl === 'signature') return require('../../app-assets/level-signature.svg');
  if (normLvl === 'fellow') return require('../../app-assets/level-fellow.svg');
  return require('../../app-assets/verified-check.svg'); // default
};

function AvatarContainer({ photoUrl, isOnline, mentorlevel }: AvatarContainerProps) {
  return (
    <View style={styles.avatarContainer}>
      <Image 
        source={photoUrl ? { uri: photoUrl } : require('../../app-assets/profile-circle.svg')} 
        style={styles.avatar} 
      />
      <Image source={getLevelIcon(mentorlevel)} style={styles.verifiedIcon} />
      {isOnline && <View style={styles.onlineDot} />}
    </View>
  );
}

interface StatsRowProps {
  isFavorite: boolean;
  toggleFavorite: () => void;
  sessions: number;
  rating: number;
  reviews: number;
}

function StatsRow({ isFavorite, toggleFavorite, sessions, rating, reviews }: StatsRowProps) {
  return (
    <View style={styles.statsRow}>
      <TouchableOpacity style={styles.statItem} onPress={toggleFavorite}>
        <Image 
          source={require('../../app-assets/heart-icon.svg')} 
          style={styles.statIcon} 
          tintColor={isFavorite ? "#ef4444" : "#444653"}
        />
        <Text style={styles.statLabel}>MY FAVOURITE</Text>
      </TouchableOpacity>
      
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{sessions}</Text>
        <Text style={styles.statLabel}>SESSIONS</Text>
      </View>

      <View style={styles.statItem}>
        <View style={styles.ratingRow}>
          <Text style={styles.statValue}>{rating}</Text>
          <Image 
            source={require('../../app-assets/star-icon.svg')} 
            style={styles.starIconSmall} 
            tintColor="#f59e0b"
          />
        </View>
        <Text style={styles.statLabel}>{reviews} REVIEW</Text>
      </View>
    </View>
  );
}

interface ActionButtonsProps {
  isOnline: boolean;
  isInitiating: boolean;
  onCall: () => void;
  onChat: () => void;
  onSchedule: () => void;
}

function ActionButtons({ isOnline, isInitiating, onCall, onChat, onSchedule }: ActionButtonsProps) {
  return (
    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={[styles.callButton, (!isOnline || isInitiating) && styles.disabledButton]} 
        onPress={onCall}
        disabled={isInitiating}
      >
        {isInitiating ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.callButtonText}>Call Now</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.chatButton} onPress={onChat}>
        <Text style={styles.chatButtonText}>Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.scheduleButton} onPress={onSchedule}>
        <Text style={styles.scheduleButtonText}>Schedule Call</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  profileCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  topInfo: {
    flexDirection: 'row',
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  verifiedIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
  },
  onlineDot: {
    position: 'absolute',
    top: -4,
    right: width * 0.7, // This was relative in Figma, adjusting
  },
  nameSection: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  iitText: {
    fontSize: 12,
    color: '#444653',
    marginTop: 2,
  },
  branchText: {
    fontSize: 12,
    color: '#444653',
  },
  priceTag: {
    alignItems: 'flex-end',
    position: 'absolute',
    right: 0,
    top: 6,
  },
  originalPriceText: {
    fontSize: 10,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginBottom: 1,
  },
  priceAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'black',
  },
  priceUnit: {
    fontSize: 12,
    color: '#444653',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 15,
    height: 15,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'black',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIconSmall: {
    width: 12,
    height: 12,
    marginLeft: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#444653',
    marginTop: 2,
  },
  bioContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  bioText: {
    fontSize: 12,
    color: 'black',
    textAlign: 'center',
  },
  actionButtons: {
    gap: 8,
  },
  callButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#93c5fd',
  },
  callButtonText: {
    color: 'white',
    fontSize: 12,
  },
  chatButton: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    color: '#444653',
    fontSize: 12,
  },
  scheduleButton: {
    backgroundColor: '#d7e3ff',
    borderRadius: 8,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleButtonText: {
    color: '#163b8c',
    fontSize: 12,
  },
});
