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
  originalPrice?: number | null;
  isFavorite: boolean;
  photoUrl?: string;
  isOnline?: boolean;
  onPress?: () => void;
  onFavoritePress?: () => void;
  onCallPress?: () => void;
  mentorlevel?: string;
}

const getLevelIcon = (lvl?: string) => {
  const normLvl = lvl?.toLowerCase();
  if (normLvl === 'verified') return require('../app-assets/level-verified.svg');
  if (normLvl === 'standard') return require('../app-assets/level-standard.svg');
  if (normLvl === 'signature') return require('../app-assets/level-signature.svg');
  if (normLvl === 'fellow') return require('../app-assets/level-fellow.svg');
  return require('../app-assets/verified-check.svg'); // default
};

const MentorCard: React.FC<MentorCardProps> = ({
  name,
  iit,
  branch,
  year,
  rating,
  calls,
  price,
  originalPrice,
  isFavorite,
  photoUrl,
  isOnline,
  onPress,
  onFavoritePress,
  onCallPress,
  mentorlevel,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image 
          source={photoUrl ? { uri: photoUrl } : require('../app-assets/profile-circle.svg')} 
          style={styles.avatar} 
        />
        {isOnline && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.name}>{name}</Text>
            <Image source={getLevelIcon(mentorlevel)} style={{ width: 14, height: 14 }} />
          </View>
          <TouchableOpacity onPress={onFavoritePress}>
            <Image
              source={require('../app-assets/heart-icon.svg')}
              style={styles.heartIcon}
              tintColor={isFavorite ? '#0077CB' : '#c4c5d5'}
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
        {onCallPress && (
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              onCallPress();
            }}
            style={[
              styles.callButton,
              isOnline ? styles.callButtonOnline : styles.callButtonOffline
            ]}
            activeOpacity={0.6}
          >
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>
        )}
        <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
          {originalPrice && originalPrice > price ? (
            <Text style={styles.originalPriceText}>{originalPrice} credits/min</Text>
          ) : null}
          <Text style={styles.priceText}>
            <Text style={styles.priceAmount}>{price}</Text>
            <Text style={styles.priceUnit}> credits/min</Text>
          </Text>
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
    justifyContent: 'space-between',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: 'white',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0b1c30',
  },
  heartIcon: {
    width: 16,
    height: 16,
  },
  iitText: {
    fontSize: 11,
    color: '#444653',
    marginBottom: 2,
  },
  branchRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  branchText: {
    fontSize: 10,
    color: '#757684',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 4,
    paddingRight: 4,
  },
  callButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonOnline: {
    backgroundColor: '#0077CB',
  },
  callButtonOffline: {
    backgroundColor: '#93c5fd',
  },
  callButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  priceText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  originalPriceText: {
    fontSize: 10,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginBottom: 1,
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
