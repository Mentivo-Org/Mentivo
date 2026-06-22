import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import SessionCard from '../../components/SessionCard';
import api from '../../services/api';
import { CallEndpoints } from '../../constants/endpoint';

export default function YourSession() {
  const navigation = useNavigation<any>();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get(CallEndpoints.getStudentSessions);
      if (response.status === 200) {
        // Transform backend data to frontend expectations
        const formatted = response.data.map((s: any) => {
          const durationMins = Math.floor(s.durationSecs / 60);
          const durationSecs = s.durationSecs % 60;
          const durationStr = `${durationMins}M ${durationSecs}S`;

          return {
            id: s.id,
            name: s.mentor?.name || 'Unknown Mentor',
            iit: s.mentor?.mentorProfile?.iit_name || 'Unknown IIT',
            branch: s.mentor?.mentorProfile?.branch || '',
            year: s.mentor?.mentorProfile?.year ? `Y${s.mentor.mentorProfile.year}` : '',
            rating: s.mentor?.mentorProfile?.avg_rating || 0,
            calls: s.mentor?.mentorProfile?.total_calls || 0,
            duration: durationStr,
            isFavorite: false, // You could sync this from favoriteIds if needed
          };
        });
        setSessions(formatted);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../../app-assets/arrow-back-up.svg')} style={styles.backIcon} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image source={require('../../app-assets/logo.svg')} style={styles.logoIcon} />
          <Text style={styles.logoText}>entivo</Text>
        </View>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Your session</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0077CB" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <SessionCard key={session.id} {...session} />
            ))
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No sessions found</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    color: 'black',
    marginLeft: 2,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077CB',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#444653',
  },
});
