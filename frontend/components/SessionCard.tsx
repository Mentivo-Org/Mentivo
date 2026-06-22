import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';

interface SessionCardProps {
  name: string;
  iit: string;
  branch: string;
  year: string;
  rating: number;
  calls: number;
  duration: string;
  isFavorite: boolean;
  onPress?: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({
  name,
  iit,
  branch,
  year,
  rating,
  calls,
  duration,
  isFavorite,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarPlaceholder} />

      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name}</Text>
          <Image
            source={require('../app-assets/heart-icon.svg')}
            style={styles.heartIcon}
            tintColor={isFavorite ? '#0077CB' : '#c4c5d5'}
          />
        </View>

        <Text style={styles.iitText}>{iit}</Text>
        <Text style={styles.branchText}>{branch} • {year}</Text>

        <View style={styles.bottomRow}>
          <View style={styles.statsRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{rating}</Text>
              <Image 
                source={require('../app-assets/star-icon.svg')} 
                style={styles.starIcon} 
                tintColor="#f59e0b"
              />
            </View>
            <Text style={styles.callsText}>{calls} calls</Text>
          </View>
          
          <Text style={styles.durationText}>{duration}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: '#c0c0c0',
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b1c30',
  },
  heartIcon: {
    width: 15,
    height: 15,
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
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#444653',
    marginRight: 2,
  },
  starIcon: {
    width: 12,
    height: 12,
  },
  callsText: {
    fontSize: 12,
    color: '#444653',
  },
  durationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
  },
});

export default SessionCard;
