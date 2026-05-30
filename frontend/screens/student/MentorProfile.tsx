import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");


export default function MentorProfile() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mentorId } = route.params || {};

  // Mock data - in a real app, fetch this based on mentorId
  const mentor = {
    name: 'Suraj Jain',
    iit: 'IIT Guwahati',
    branch: 'CSE',
    year: 'Y3',
    rating: 4.6,
    reviews: 122,
    sessions: 25,
    price: 7,
    isFavorite: true,
    isOnline: true,
    bio: 'Life is short, live it like a pro.',
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
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder} />
            <Image source={require('../../app-assets/verified-check.svg')} style={styles.verifiedIcon} />
            {mentor.isOnline && <View style={styles.onlineDot} />}
          </View>
          
          <View style={styles.nameSection}>
            <Text style={styles.name}>{mentor.name}</Text>
            <Text style={styles.iitText}>{mentor.iit}</Text>
            <Text style={styles.branchText}>{mentor.branch} {mentor.year}</Text>
          </View>

          <View style={styles.priceTag}>
            <Text style={styles.priceAmount}>₹{mentor.price}</Text>
            <Text style={styles.priceUnit}>/min</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Image 
              source={require('../../app-assets/heart-icon.svg')} 
              style={styles.statIcon} 
              tintColor={mentor.isFavorite ? "#2563eb" : "#444653"}
            />
            <Text style={styles.statLabel}>MY FAVOURITE</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mentor.sessions}</Text>
            <Text style={styles.statLabel}>SESSIONS</Text>
          </View>

          <View style={styles.statItem}>
            <View style={styles.ratingRow}>
              <Text style={styles.statValue}>{mentor.rating}</Text>
              <Image 
                source={require('../../app-assets/star-icon.svg')} 
                style={styles.starIconSmall} 
                tintColor="#f59e0b"
              />
            </View>
            <Text style={styles.statLabel}>{mentor.reviews} REVIEW</Text>
          </View>
        </View>

        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>{mentor.bio}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.callButton}>
            <Text style={styles.callButtonText}>Call Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.chatButton}>
            <Text style={styles.chatButtonText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.scheduleButton}>
            <Text style={styles.scheduleButtonText}>Schedule Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
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
  avatarPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: '#c0c0c0',
    borderRadius: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
    top: 10,
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
