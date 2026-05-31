import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';

interface MentorCardProps {
  name: string;
  iit: string;
  branch: string;
  year: string;
  rating: number;
  calls: number;
  price: number;
  isFavorite: boolean;
  isOnline?: boolean;
  onPress?: () => void;
  onFavoritePress?: () => void;
}

const MentorCard: React.FC<MentorCardProps> = ({
  name,
  iit,
  branch,
  year,
  rating,
  calls,
  price,
  isFavorite,
  isOnline,
  onPress,
  onFavoritePress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <View style={styles.avatarPlaceholder} />
        {isOnline && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name}</Text>
          <TouchableOpacity onPress={onFavoritePress}>
            <Image
              source={require('../app-assets/heart-icon.svg')}
              style={styles.heartIcon}
              tintColor={isFavorite ? '#2563eb' : '#c4c5d5'}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.iitText}>{iit}</Text>
        <View style={styles.branchRow}>
          <Text style={styles.branchText}>{branch}</Text>
          <Text style={styles.branchText}> {year}</Text>
        </View>

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
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>
          <Text style={styles.priceAmount}>₹{price}</Text>
          <Text style={styles.priceUnit}>/min</Text>
        </Text>
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
  imageContainer: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: '#c0c0c0',
    borderRadius: 8,
  },
  onlineDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    backgroundColor: '#10b981',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'white',
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
  branchRow: {
    flexDirection: 'row',
  },
  branchText: {
    fontSize: 12,
    color: '#444653',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
  priceContainer: {
    justifyContent: 'flex-end',
    paddingBottom: 4,
    paddingRight: 4,
  },
  priceText: {
    fontSize: 12,
  },
  priceAmount: {
    fontWeight: 'bold',
    color: '#0b1c30',
  },
  priceUnit: {
    color: '#444653',
  },
});

export default MentorCard;
