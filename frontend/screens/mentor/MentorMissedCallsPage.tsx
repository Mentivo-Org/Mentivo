import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import api from '../../services/api';
import { CallEndpoints } from '../../constants/endpoint';
import DialogBox from '../../components/DialogBox';

interface MissedCall {
  id: string;
  createdAt: string;
  student: {
    name: string | null;
    email: string | null;
    photo_url: string | null;
  };
}

const MentorMissedCallsPage = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [missedCalls, setMissedCalls] = useState<MissedCall[]>([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '' });

  const fetchMissedCalls = async () => {
    setLoading(true);
    try {
      const response = await api.get(`${CallEndpoints.getMentorSessions}?status=missed&limit=50`);
      if (response.status === 200) {
        setMissedCalls(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch missed calls:', err);
      setAlertData({
        title: 'Error',
        message: err.response?.data?.error || 'Failed to retrieve missed calls history.',
      });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissedCalls();
  }, []);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    // If within 24 hours, show relative time
    if (diffMins < 60) {
      return diffMins <= 0 ? 'Just now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      // Show absolute date
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

  const renderItem = ({ item }: { item: MissedCall }) => (
    <View style={styles.card}>
      <View style={styles.avatarContainer}>
        {item.student?.photo_url ? (
          <Image source={{ uri: item.student.photo_url }} style={styles.avatar} />
        ) : (
          <Image source={require('../../app-assets/profile-circle.svg')} style={styles.avatar} tintColor="#c4c5d5" />
        )}
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.studentName}>{item.student?.name || 'Student'}</Text>
        <Text style={styles.callType}>Missed voice call</Text>
      </View>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require('../../app-assets/arrow-back-up.svg')} style={styles.backIcon} tintColor="#0b1c30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Missed Calls</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#dc2626" />
        </View>
      ) : (
        <FlatList
          data={missedCalls}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No missed calls</Text>
            </View>
          }
        />
      )}

      <DialogBox
        title={alertData.title}
        message={alertData.message}
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b1c30',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b1c30',
  },
  callType: {
    fontSize: 13,
    color: '#dc2626',
    marginTop: 2,
    fontWeight: '500',
  },
  timeContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#444653',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#444653',
  },
});

export default MentorMissedCallsPage;
