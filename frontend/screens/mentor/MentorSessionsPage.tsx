import React, { useEffect, useState, useCallback } from "react";
import { Text, View, FlatList, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import api from "../../services/api";
import { CallEndpoints } from "../../constants/endpoint";
import { useNavigation } from "@react-navigation/native";

export default function MentorSessionsPage() {
  const navigation = useNavigation<any>();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 15;

  const fetchSessions = async (pageNum = 0, silent = false) => {
    if (pageNum === 0 && !silent) setLoading(true);
    try {
      const offset = pageNum * limit;
      const response = await api.get(`${CallEndpoints.getMentorSessions}?limit=${limit}&offset=${offset}`);
      
      if (response.status === 200) {
        const data = response.data;
        if (pageNum === 0) {
          setSessions(data);
        } else {
          setSessions(prev => [...prev, ...data]);
        }
        setHasMore(data.length === limit);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchSessions(0, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSessions(nextPage);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.historyItem}>
      <View style={styles.studentAvatar}>
        {item.student?.photo_url ? (
            <Image source={{ uri: item.student.photo_url }} style={styles.avatarImg} />
        ) : (
            <Image source={require("../../app-assets/profile-circle.svg")} style={styles.avatarImg} tintColor="#c0c0c0" />
        )}
      </View>
      <View style={styles.historyInfo}>
        <View style={styles.historyTopRow}>
          <Text style={styles.studentName}>{item.student?.name || "Student"}</Text>
          <Text style={styles.earningText}>{item.mentorEarning || 0} credits</Text>
        </View>
        <View style={styles.historyBottomRow}>
          <Text style={styles.durationText}>{Math.floor((item.durationSecs || 0) / 60)}m {item.durationSecs % 60}s</Text>
          <Text style={styles.dateText}>{formatFullDate(item.createdAt)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require("../../app-assets/arrow-back-up.svg")} style={styles.backIcon} tintColor="#444653" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Sessions</Text>
      </View>

      {loading && sessions.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0077CB" />
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No sessions found</Text>}
          ListFooterComponent={hasMore ? <ActivityIndicator style={{ marginVertical: 20 }} color="#0077CB" /> : null}
        />
      )}
    </SafeAreaView>
  );
}

function formatFullDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 4,
    marginRight: 16,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#444653',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 16,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  earningText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#25d366',
  },
  historyBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: '#7e7e7e',
  },
  dateText: {
    fontSize: 12,
    color: '#0077CB',
  },
  emptyText: {
    textAlign: 'center',
    color: '#7e7e7e',
    marginTop: 40,
  }
});
