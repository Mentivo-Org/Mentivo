import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const imgLine1 = "https://www.figma.com/api/mcp/asset/1ea4a1ec-b101-47ab-a3bd-58924504a1fc";
const imgContainer = "https://www.figma.com/api/mcp/asset/1ac9faec-22e5-4230-80dc-02350e0c1f6c";
const imgEllipse7 = "https://www.figma.com/api/mcp/asset/f0c4c0fe-c5c3-4c22-b1ac-e14a740a0258";
const imgIconstackIoHeart = "https://www.figma.com/api/mcp/asset/d044bb49-e83f-4717-9e72-9c282df68f08";
const imgIconstackIoStar = "https://www.figma.com/api/mcp/asset/f7552578-f33e-4001-92b5-492d06504a77";
const imgIconstackIoLogin1 = "https://www.figma.com/api/mcp/asset/0d3bd481-870d-482c-b25f-cc1bc3eec5da";
const imgIconstackIoSearch = "https://www.figma.com/api/mcp/asset/cb6db1db-1210-4521-bd0c-4d298c0de1f4";
const imgIconstackIoBook = "https://www.figma.com/api/mcp/asset/d46e39b6-ce52-45bf-a9b3-bdf40ec9081d";
const imgFrame22 = "https://www.figma.com/api/mcp/asset/b27abc95-b6a0-425a-b467-a237d149eaba";

const LandingPage = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../logo.svg')} style={styles.logoIcon} />
            <Text style={styles.logoText}>entivo</Text>
          </View>
          <View style={styles.navLinks}>
            <Text style={styles.navText}>MENTORS</Text>
            <Text style={styles.navText}>REVIEW</Text>
            <TouchableOpacity onPress={() => navigation.navigate('StudentLogin')}>
              <Text style={styles.navText}>LOGIN</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>IITian Guidance,</Text>
          <Text style={[styles.heroTitle, { color: '#1d459c' }]}>Real Results</Text>
          
          <View style={styles.heroDescriptionContainer}>
            <View style={styles.verticalLineContainer}>
              <Image source={{ uri: imgLine1 }} style={styles.verticalLine} contentFit='fill' />
            </View>
            <Text style={styles.heroDescription}>
              Unlock your potential with personalized mentorship from IITians. Turn ambition into achievement with expert guidance.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.getStartedButton}
            onPress={() => navigation.navigate('RoleSelection')}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
            <Image source={{ uri: imgContainer }} style={styles.arrowIcon} />
          </TouchableOpacity>
        </View>

        {/* Top Mentors */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top mentors</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mentorScroll}>
          {[
            { name: 'Suraj Jain', college: 'IIT Guwahati', rating: '4.6' },
            { name: 'Abhirajya Yadav', college: 'IIT Guwahati', rating: '4.8' },
            { name: 'Suraj Jain', college: 'IIT Guwahati', rating: '4.0' },
          ].map((mentor, index) => (
            <View key={index} style={styles.mentorCard}>
              <View style={styles.mentorHeader}>
                <Image source={{ uri: imgEllipse7 }} style={styles.mentorAvatar} />
                <Image source={{ uri: imgIconstackIoHeart }} style={styles.heartIcon} />
              </View>
              <Text style={styles.mentorName}>{mentor.name}</Text>
              <View style={styles.mentorFooter}>
                <Text style={styles.mentorCollege}>{mentor.college}</Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingText}>{mentor.rating}</Text>
                  <Image source={{ uri: imgIconstackIoStar }} style={styles.starIcon} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* How it works */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>How it works?</Text>
        </View>
        <View style={styles.howItWorksGrid}>
          {[
            { label: 'login', icon: imgIconstackIoLogin1 },
            { label: 'Explore Mentor', icon: imgIconstackIoSearch },
            { label: 'Contact', icon: imgIconstackIoHeart }, // Replacing with phone if needed
            { label: 'Learn', icon: imgIconstackIoBook },
          ].map((item, index) => (
            <View key={index} style={styles.howItWorksItem}>
              <View style={styles.iconWrapper}>
                <Image source={{ uri: item.icon }} style={styles.gridIcon} />
              </View>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Features */}
        <View style={styles.featureSection}>
          <Text style={styles.featureTitle}>Smart Scheduling</Text>
          <View style={styles.featureCard}>
             <View style={styles.featureBlueLine} />
             <Text style={styles.featureDescription}>
               Seamlessly book sessions that fit both your schedules perfectly
             </Text>
          </View>

          <Text style={styles.featureTitle}>Personalized</Text>
          <View style={styles.featureCard}>
             <View style={styles.featureBlueLine} />
             <Text style={styles.featureDescription}>
               Curated mentorship plans tailored to your specific academic goals.
             </Text>
          </View>

          <Text style={styles.featureTitle}>Our Connections</Text>
          <View style={styles.featureCard}>
             <View style={styles.featureBlueLine} />
             <Text style={styles.featureDescription}>
               We have mentors across all 23 IITs.
             </Text>
          </View>
        </View>

        {/* Spacer for bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginLeft: 16,
    color: 'black',
    fontWeight: '500',
  },
  heroCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
    letterSpacing: -1,
  },
  heroDescriptionContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  verticalLineContainer: {
    width: 2,
    height: 60,
    marginRight: 12,
  },
  verticalLine: {
    width: '100%',
    height: '100%',
  },
  heroDescription: {
    flex: 1,
    fontSize: 14,
    color: '#444653',
    lineHeight: 22,
  },
  getStartedButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 32,
  },
  getStartedText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    marginRight: 10,
  },
  arrowIcon: {
    width: 20,
    height: 12,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  mentorScroll: {
    paddingLeft: 20,
    paddingBottom: 10,
  },
  mentorCard: {
    backgroundColor: 'white',
    width: 150,
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mentorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mentorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  heartIcon: {
    width: 15,
    height: 15,
  },
  mentorName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mentorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mentorCollege: {
    fontSize: 10,
    color: '#444653',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 10,
    marginRight: 2,
  },
  starIcon: {
    width: 10, height: 10,
  },
  howItWorksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  howItWorksItem: {
    alignItems: 'center',
    width: (width - 40) / 4,
  },
  iconWrapper: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  gridIcon: {
    width: 24,
    height: 24,
  },
  gridLabel: {
    fontSize: 10,
    textAlign: 'center',
    color: 'black',
  },
  featureSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  featureCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureBlueLine: {
    width: 2,
    height: 40,
    backgroundColor: '#2563eb',
    marginRight: 12,
  },
  featureDescription: {
    flex: 1,
    fontSize: 14,
    color: '#444653',
    lineHeight: 20,
  },
});

export default LandingPage;
