import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { chatSessionManager } from '../../services/chat/chatSessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { MentorEndpoints } from '../../constants/endpoint';

const { width } = Dimensions.get('window');

const ChatListPage = () => {
  const navigation = useNavigation<any>();
  const [sessions, setSessions] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const init = async () => {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setCurrentUserId(user.id);
      }
      fetchData();
    };
    init();

    // Refresh data whenever this screen comes back into focus
    // (e.g. returning from ChatPage after reading messages)
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      let userRole = 'student';
      if (userJson) {
        const user = JSON.parse(userJson);
        userRole = user.role;
      }

      if (userRole === 'mentor') {
        const sessionsData = await chatSessionManager.listSessions();
        setSessions(sessionsData);
        setFavorites([]);
      } else {
        const [sessionsData, favoritesData] = await Promise.all([
          chatSessionManager.listSessions(),
          api.get(MentorEndpoints.getFavoriteMentors).then(res => res.data).catch(() => [])
        ]);
        
        const formattedFavorites = (favoritesData || []).map((fav: any) => ({
          id: fav.mentorId,
          name: fav.user?.name || 'Unknown Mentor',
          iit: fav.iit_name || fav.iit || 'IIT Graduate',
          iit_name: fav.iit_name,
          branch: fav.branch || '',
          year: fav.year || '',
          price: fav.price || 10,
          photo_url: fav.user?.photo_url || fav.photo_url,
          photoUrl: fav.user?.photo_url || fav.photo_url,
          bio: fav.bio || '',
          isOnline: fav.isOnline || false,
          rating: fav.avg_rating || 0,
        }));

        setSessions(sessionsData);
        setFavorites(formattedFavorites);
      }
    } catch (e) {
      console.error('Fetch Data Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const partner = session.studentId === currentUserId ? session.mentor : session.student;
    if (!partner) return false;
    const nameMatch = partner.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const iitMatch = (partner.iit || partner.iit_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || iitMatch;
  });

  const filteredFavorites = favorites.filter(mentor => {
    const nameMatch = mentor.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const iitMatch = (mentor.iit || mentor.iit_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || iitMatch;
  });

  const renderFavoriteItem = (mentor: any, index: number) => (
    <TouchableOpacity 
      key={mentor.id || mentor._id || `fav-${index}`}
      onPress={() => navigation.navigate('MentorProfile', { mentor })}
      style={styles.favoriteItem}
      activeOpacity={0.7}
    >
      <Image 
        source={mentor.photo_url ? { uri: mentor.photo_url } : require('../../app-assets/avatar-placeholder.svg')}
        style={styles.avatar}
      />
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{mentor.name}</Text>
        <Text style={styles.itemSubtitle}>{mentor.iit || mentor.iit_name || 'IIT Graduate'}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentItem = (session: any, index: number) => {
    const partner = session.studentId === currentUserId ? session.mentor : session.student;
    console.log("Partner is",partner);
    if (!partner) return null;

    const timeAgo = session.lastMessageAt ? getTimeAgo(new Date(session.lastMessageAt)) : '';
    const hasUnread = session.messageCount > 0;

    return (
      <TouchableOpacity 
        key={session.id || session._id || `recent-${index}`}
        onPress={() => navigation.navigate('ChatPage', { 
          partnerId: partner.id, 
          partnerName: partner.name,
          sessionId: session.id 
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
              {partner.grade!=null ? ("Grade "+ partner.grade) : partner.iit_name }
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
            placeholder="Explore mentor by IIT name"
            style={styles.searchInput}
            placeholderTextColor="#444653"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

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
            Connect with verified IIT students to start your mentorship journey.
          </Text>
          <TouchableOpacity 
            style={styles.findMentorButton}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.7}
          >
            <Text style={styles.findMentorButtonText}>Explore Mentors</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
          {/* Favourites Section */}
          {filteredFavorites.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Favourites</Text>
              {filteredFavorites.map((mentor, index) => renderFavoriteItem(mentor, index))}
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
                source={require('../../app-assets/mentoring-icon-white.svg')}
                style={styles.bottomBarIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Ask')} activeOpacity={0.7}>
              <Image 
                source={require('../../app-assets/circle-plus.svg')}
                style={styles.bottomBarIcon}
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
  findMentorButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  findMentorButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ChatListPage;
