import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { MentorEndpoints } from '../../constants/endpoint';
import { chatSessionManager } from '../../services/chat/chatSessionManager';

const MentorChatListPage = () => {
  const navigation = useNavigation<any>();
  const [sessions, setSessions] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          setCurrentUserId(user.id);
        }
      } catch (e) {
        console.error('Error reading user from storage:', e);
      }
    };
    getUserId();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsData, favoritesData] = await Promise.all([
        chatSessionManager.listSessions(),
        api.get(MentorEndpoints.getFavoriteMentors).then(res => res.data).catch(() => [])
      ]);

      const formattedFavorites = (favoritesData || []).map((fav: any) => ({
        id: fav.id || fav.mentorId,
        name: fav.name || 'Unknown Student',
        grade: fav.grade || 'Grade 11',
        photo_url: fav.photo_url || fav.photoUrl,
      }));

      setSessions(sessionsData);
      setFavorites(formattedFavorites);
    } catch (e) {
      console.error('Fetch Data Error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Add focus listener to refresh data when navigating back to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const filteredFavorites = favorites.filter((student: any) => {
    const nameMatch = (student.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const gradeMatch = (student.grade || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || gradeMatch;
  });

  const filteredSessions = sessions.filter((session: any) => {
    const partner = session.studentId === currentUserId ? session.mentor : session.student;
    if (!partner) return false;
    const nameMatch = (partner.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const gradeMatch = (partner.grade || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || gradeMatch;
  });

  const renderFavoriteItem = (student: any, index: number) => (
    <TouchableOpacity 
      key={student.id || `fav-${index}`}
      onPress={async () => {
        try {
          setLoading(true);
          const session = await chatSessionManager.createSession(student.id);
          navigation.navigate('ChatPage', {
            partnerId: student.id,
            partnerName: student.name,
            sessionId: session.id,
            partnerPhotoUrl: student.photo_url || null
          });
        } catch (error) {
          console.error('Failed to open favorite student chat:', error);
        } finally {
          setLoading(false);
        }
      }}
      style={styles.favoriteItem}
      activeOpacity={0.7}
    >
      <Image 
        source={student.photo_url ? { uri: student.photo_url } : require('../../app-assets/avatar-placeholder.svg')}
        style={styles.avatar}
      />
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{student.name}</Text>
        <Text style={styles.itemSubtitle}>{student.grade || 'Student'}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentItem = (session: any, index: number) => {
    const partner = session.studentId === currentUserId ? session.mentor : session.student;
    if (!partner) return null;

    const timeAgo = session.lastMessageAt ? getTimeAgo(new Date(session.lastMessageAt)) : '';
    const hasUnread = session.messageCount > 0;

    return (
      <TouchableOpacity 
        key={session.id || session._id || `recent-${index}`}
        onPress={() => navigation.navigate('ChatPage', { 
          partnerId: partner.id, 
          partnerName: partner.name,
          sessionId: session.id,
          partnerPhotoUrl: partner.photo_url || null
        })}
        style={styles.recentItem}
        activeOpacity={0.7}
      >
        <Image 
          source={partner.photo_url ? { uri: partner.photo_url } : require('../../app-assets/avatar-placeholder.svg')}
          style={styles.avatar}
        />
        <View style={styles.itemTextContainer}>
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>{partner.name}</Text>
            <Text style={[styles.timeText, { color: hasUnread ? '#2563eb' : '#444653' }]}>
              {timeAgo}
            </Text>
          </View>
          <View style={styles.itemSubRow}>
            <Text style={styles.itemSubtitle} numberOfLines={1}>
              {partner.grade || 'Student'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{session.messageCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'm';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'min';
    return Math.floor(seconds) + 's';
  };

  const canGoBack = navigation.canGoBack();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {canGoBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <Image 
              source={require('../../app-assets/arrow-back-up.svg')}
              style={{ width: 24, height: 24 }}
              tintColor="#444653"
            />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Message</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBarWrapper}>
          <Image 
            source={require('../../app-assets/search-icon.svg')}
            style={styles.searchIcon}
            tintColor="#444653"
          />
          <TextInput
            placeholder="Search student"
            placeholderTextColor="#444653"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : filteredFavorites.length === 0 && filteredSessions.length === 0 ? (
        <View style={styles.emptyScreenContainer}>
          <Image 
            source={require('../../app-assets/chat-round-active.svg')}
            style={styles.emptyScreenIcon}
            tintColor="#444653"
          />
          <Text style={styles.emptyScreenTitle}>No Messages Yet</Text>
          <Text style={styles.emptyScreenSubtitle}>
            Your students will show up here once you connect or start a chat session.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
          {/* Favourites Section */}
          {filteredFavorites.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Favourites</Text>
              {filteredFavorites.map((student, index) => renderFavoriteItem(student, index))}
            </View>
          )}

          {/* Recent Section */}
          <View>
            <Text style={styles.sectionTitle}>Recent</Text>
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session, index) => renderRecentItem(session, index))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No conversations yet</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Floating Bottom Bar */}
      <View style={styles.floatingBottomBar}>
        <View style={styles.relativeWrapper}>
          {/* Circle Background for Active Icon */}
          <View style={styles.ellipseBg}>
             <Image 
                source={require('../../app-assets/ellipse-12.svg')}
                style={{ width: 37, height: 37 }}
             />
          </View>

          {/* Main Blue Bar */}
          <View style={styles.blueBar}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')} activeOpacity={0.7}>
              <Image 
                source={require('../../app-assets/profile-circle.svg')}
                style={styles.bottomBarIcon}
                tintColor="#ffffff"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Ask')} activeOpacity={0.7}>
              <Image 
                source={require('../../app-assets/mail-icon.svg')}
                style={styles.bottomBarIcon}
                tintColor="#ffffff"
              />
            </TouchableOpacity>
          </View>

          {/* Chat Active Indicator */}
          <View style={styles.chatActiveContainer}>
              <View style={styles.chatActiveWrapper}>
                 <Image 
                   source={require('../../app-assets/chat-round-active.svg')}
                   style={styles.chatActiveIcon}
                 />
              </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    color: '#444653',
    fontWeight: 'normal',
    lineHeight: 19,
  },
  searchBarContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  searchBarWrapper: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 28,
    paddingRight: 16,
    borderRadius: 39,
    width: 255,
    height: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 4,
  },
  searchIcon: {
    width: 11,
    height: 11,
  },
  searchInput: {
    flex: 1,
    marginLeft: 16,
    fontSize: 12,
    color: '#444653',
    fontWeight: 'normal',
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    marginTop: 24,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  sectionContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    fontSize: 16,
    color: 'black',
    fontWeight: 'normal',
    marginBottom: 16,
    lineHeight: 19,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#c0c0c0',
  },
  itemTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    color: 'black',
    fontWeight: 'normal',
    lineHeight: 19,
  },
  timeText: {
    fontSize: 12,
    lineHeight: 14,
  },
  itemSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#444653',
    flex: 1,
    marginRight: 8,
    lineHeight: 14,
  },
  unreadBadge: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  floatingBottomBar: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    alignItems: 'center',
  },
  relativeWrapper: {
    position: 'relative',
    width: 195,
    height: 37,
  },
  ellipseBg: {
    position: 'absolute',
    top: -18,
    left: '50%',
    marginLeft: -18.5,
    width: 37,
    height: 37,
  },
  blueBar: {
    backgroundColor: '#2563eb',
    height: 37,
    width: 195,
    borderRadius: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  bottomBarIcon: {
    width: 16,
    height: 16,
  },
  chatActiveContainer: {
    position: 'absolute',
    top: -13,
    left: '50%',
    marginLeft: -14,
  },
  chatActiveWrapper: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 6,
    width: 28,
    height: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatActiveIcon: {
    width: 16,
    height: 16,
  },
  emptyScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  emptyScreenIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyScreenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444653',
    marginBottom: 8,
  },
  emptyScreenSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
});

export default MentorChatListPage;