import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { saveReferralCode } from '../services/referral';
import { PartnerEndpoints, MentorEndpoints, websiteUrl } from '../constants/endpoint';
import api from '../services/api';
import { useLoading } from '../context/LoadingContext';
import DialogBox from '../components/DialogBox';

const { width } = Dimensions.get('window');

const LandingPage = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showLoading, hideLoading } = useLoading();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '' });
  const [onCloseCallback, setOnCloseCallback] = useState<(() => void) | null>(null);
  const [topMentors, setTopMentors] = useState<any[]>([]);

  const handleLinkPress = async (link: string) => {
    try {
      const linkSuffix = link.split(" ",1)[0].toLowerCase();

      // Construct redirection URL to Next.js website
      const redirectUrl = `${websiteUrl}/${linkSuffix}`;
      
      console.log(`Redirecting user to ${linkSuffix} :`, redirectUrl);
      
      try {
        await WebBrowser.openBrowserAsync(redirectUrl);
      } catch (browserErr) {
        console.warn("expo-web-browser failed, falling back to Linking.openURL:", browserErr);
        await Linking.openURL(redirectUrl);
      }
    } catch (err) {
      console.error("Redirection error:", err);
      setAlertData({ title: "Error", message: "An unexpected error occurred." });
      setAlertVisible(true);
    }
  }

  useEffect(() => {
    const validateReferral = async () => {
      const { referral_id } = route.params ?? {};
      if (referral_id) {
        // Persist before validating: a network failure here would otherwise discard
        // the code for good, since the URL is gone by the next app open. An unknown
        // code is harmless — the backend resolves it to null at signup.
        await saveReferralCode(referral_id, { force: true });
        showLoading("Verifying referral code...");
        try {
          const response = await api.post(PartnerEndpoints.validate, { code: referral_id });
          hideLoading();
          if (response.data.valid) {
            setAlertData({
              title: "Success",
              message: "Referral code applied successfully, please login"
            });
            setOnCloseCallback(() => () => {
              navigation.navigate("RoleSelection");
            });
            setAlertVisible(true);
          } else {
            setAlertData({
              title: "Invalid Referral",
              message: "The referral code is invalid."
            });
            setOnCloseCallback(null);
            setAlertVisible(true);
          }
        } catch (err: any) {
          hideLoading();
          const errMsg = err.response?.data?.error || "The referral code is invalid.";
          setAlertData({
            title: "Invalid Referral",
            message: errMsg
          });
          setOnCloseCallback(null);
          setAlertVisible(true);
        }
      }
    };

    validateReferral();
  }, [route.params]);

  useEffect(() => {
    const fetchTopMentors = async () => {
      try {
        const response = await api.get(MentorEndpoints.getTopMentors);
        if (Array.isArray(response.data)) {
          setTopMentors(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch top mentors:", err);
      }
    };
    fetchTopMentors();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../app-assets/logo.svg')} style={styles.logoIcon} />
            <Text style={styles.logoText}>entivo</Text>
          </View>
          <View style={styles.navLinks}>
            {/* <Text style={styles.navText}>MENTORS</Text>
            <Text style={styles.navText}>REVIEW</Text> */}
            <TouchableOpacity onPress={() => navigation.navigate('RoleSelection')}>
              <Text style={styles.navText}>LOGIN</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>IITian Guidance,</Text>
          <Text style={[styles.heroTitle, { color: '#0077CB' }]}>Real Results</Text>
          
          <View style={styles.heroDescriptionContainer}>
            <View style={styles.verticalLineContainer}>
              <Image source={require('../app-assets/vertical-line.svg')} style={styles.verticalLine} contentFit='fill' />
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
            <Image 
              source={require('../app-assets/arrow-right.svg')} 
              style={styles.arrowIcon} 
              tintColor="white"
            />
          </TouchableOpacity>
        </View>

        {/* Top Mentors */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top mentors</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mentorScroll}>
          {topMentors.length > 0 ? (
            topMentors.map((mentor, index) => (
              <View key={mentor.mentorId || index} style={styles.mentorCard}>
                <View style={styles.mentorHeader}>
                  {mentor.user?.photo_url ? (
                    <Image source={{ uri: mentor.user.photo_url }} style={styles.mentorAvatar} />
                  ) : (
                    <Image source={require('../app-assets/profile-circle.svg')} style={styles.mentorAvatar} />
                  )}
                  <Image source={require('../app-assets/heart-icon.svg')} style={styles.heartIcon} />
                </View>
                <Text style={styles.mentorName} numberOfLines={1}>{mentor.user?.name || mentor.name}</Text>
                <View style={styles.mentorFooter}>
                  <Text style={styles.mentorCollege} numberOfLines={1}>{mentor.iit_name || mentor.college}</Text>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>{Number(mentor.avg_rating || mentor.rating).toFixed(1)}</Text>
                    <Image source={require('../app-assets/star-icon.svg')} style={styles.starIcon} />
                  </View>
                </View>
              </View>
            ))
          ) : (
            [
              { name: 'Suraj Jain', college: 'IIT Guwahati', rating: '4.6' },
              { name: 'Abhirajya Yadav', college: 'IIT Guwahati', rating: '4.8' },
              { name: 'Suraj Jain', college: 'IIT Guwahati', rating: '4.0' },
            ].map((mentor, index) => (
              <View key={index} style={styles.mentorCard}>
                <View style={styles.mentorHeader}>
                  <Image source={require('../app-assets/profile-circle.svg')} style={styles.mentorAvatar} />
                  <Image source={require('../app-assets/heart-icon.svg')} style={styles.heartIcon} />
                </View>
                <Text style={styles.mentorName}>{mentor.name}</Text>
                <View style={styles.mentorFooter}>
                  <Text style={styles.mentorCollege}>{mentor.college}</Text>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>{mentor.rating}</Text>
                    <Image source={require('../app-assets/star-icon.svg')} style={styles.starIcon} />
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* How it works */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>How it works?</Text>
        </View>
        <View style={styles.howItWorksGrid}>
          {[
            { label: 'login', icon: require('../app-assets/login-icon.svg') },
            { label: 'Explore Mentor', icon: require('../app-assets/search-icon.svg') },
            { label: 'Contact', icon: require('../app-assets/phone-icon.svg') },
            { label: 'Learn', icon: require('../app-assets/book-icon.svg') },
          ].map((item, index) => (
            <View key={index} style={styles.howItWorksItem}>
              <View style={styles.iconWrapper}>
                <Image source={item.icon} style={styles.gridIcon} />
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

        {/* Network Section */}
        <View style={styles.networkSection}>
          <View style={styles.networkHeader}>
            <Image source={require('../app-assets/logo.svg')} style={styles.networkLogo} tintColor="white" />
            <Text style={styles.networkLogoText}>entivo</Text>
          </View>
          
          <View style={styles.networkContent}>
            <View style={styles.socialCard}>
              <TouchableOpacity style={styles.socialIconWrapper}>
                <Image source={require('../app-assets/instagram-icon.svg')} style={styles.socialIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconWrapper}>
                <Image source={require('../app-assets/meta-icon.svg')} style={styles.socialIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconWrapper}>
                <Image source={require('../app-assets/x-icon.svg')} style={styles.socialIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIconWrapper}>
                <Image source={require('../app-assets/linkedin-icon.svg')} style={styles.socialIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.networkInfo}>
              <Text style={styles.networkInfoTitle}>Our Networks</Text>
              <Image source={require('../app-assets/network-circles.svg')} style={styles.networkCircles} />
              
              <View style={styles.networkAboutContainer}>
                <Image source={require('../app-assets/network-line.svg')} style={styles.networkLine} />
                <Text style={styles.networkAboutText}>About Us</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.fillFormButton}>
            <Text style={styles.fillFormText}>Fill Form</Text>
          </TouchableOpacity>

          <Image source={require('../app-assets/tie-shape.svg')} style={styles.tieShape} />
        </View>

        {/* Collaboration Banner */}
        <View style={styles.collabBanner}>
          <Text style={styles.collabText}>Ready For Collaboration</Text>
        </View>

        {/* Footer Section */}
        <View style={styles.footerSection}>
          <View style={styles.footerBrand}>
            <View style={styles.logoContainer}>
              <Image source={require('../app-assets/logo.svg')} style={styles.logoIcon} />
              <Text style={styles.logoText}>entivo</Text>
            </View>
            <Text style={styles.footerDesc}>
              Mentivo is online JEE mentoring platform facilitating students personalized mentoring by IITian across most of the IITs.
            </Text>
          </View>

          <View style={styles.footerLinksContainer}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Quick Links</Text>
              {['About Us', 'FAQ'].map((link) => (
                <TouchableOpacity key={link} onPress={()=>handleLinkPress(link)}>
                  <Text key={link} style={styles.footerLink}>{link}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerColumnTitle}>Information</Text>
              {['Privacy Policy', 'Terms of Services', 'Disclaimer'].map((link) => (
                <TouchableOpacity key={link} onPress={()=>handleLinkPress(link)}>
                  <Text key={link} style={styles.footerLink}>{link}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <View style={styles.contactIconWrapper}>
                <Image source={require('../app-assets/phone-icon.svg')} style={styles.contactIcon} />
              </View>
              <View>
              <Text style={styles.contactText}>+91 7047911509</Text>
              <Text style={styles.contactText}>+91 9477840107</Text>
              </View>
            </View>
            <View style={styles.contactItem}>
              <View style={styles.contactIconWrapper}>
                <Image source={require('../app-assets/mail-icon.svg')} style={styles.contactIcon} />
              </View>
              <View>
                <Text style={styles.contactText}>developer@mentivo.in</Text>
                <Text style={styles.contactText}>y.abhirajya@iitg.ac.in , ceo@mentivo.in</Text>
                <Text style={styles.contactText}>ayan.bain@iitg.ac.in , cto@mentivo.in</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Spacer for bottom */}
        <View style={{ height: 40 }} />

      </ScrollView>
      <DialogBox
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        onClose={() => {
          setAlertVisible(false);
          if (onCloseCallback) onCloseCallback();
        }}
      />
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
    fontSize: 14,
    marginLeft: 16,
    marginRight: 20,
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
    backgroundColor: '#0077CB',
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
    backgroundColor: '#0077CB',
    marginRight: 12,
  },
  featureDescription: {
    flex: 1,
    fontSize: 14,
    color: '#444653',
    lineHeight: 20,
  },
  networkSection: {
    backgroundColor: '#1a365d',
    margin: 16,
    padding: 10,
    // height: 350,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  networkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  networkLogo: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  networkLogoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  networkContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialCard: {
    backgroundColor: '#f5f5f5',
    width: 70,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 12,
  },
  socialIconWrapper: {
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  networkInfo: {
    flex: 1,
    marginLeft: 40,
    // marginTop: 10,
  },
  networkInfoTitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 12,
  },
  networkCircles: {
    width: 45,
    height: 20,
    marginBottom: 20,
  },
  networkAboutContainer: {
    marginTop: 10,
  },
  networkLine: {
    width: 55,
    height: 1,
    marginBottom: 8,
  },
  networkAboutText: {
    color: 'white',
    fontSize: 14,
  },
  fillFormButton: {
    backgroundColor: 'white',
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 50,
    marginTop: -10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fillFormText: {
    color: '#444653',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tieShape: {
    position: 'absolute',
    right: 10,
    top: 0,
    width: 48,
    height: 182,
    opacity: 0.9,
  },
  collabBanner: {
    backgroundColor: 'white',
    marginHorizontal: 40,
    marginVertical: 24,
    paddingVertical: 12,
    borderRadius: 40,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  collabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'black',
  },
  footerSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerBrand: {
    marginBottom: 24,
  },
  footerDesc: {
    fontSize: 12,
    color: '#444653',
    lineHeight: 18,
    marginTop: 12,
    width: '70%',
  },
  footerLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  footerColumn: {
    flex: 1,
  },
  footerColumnTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'black',
  },
  footerLink: {
    fontSize: 12,
    color: '#444653',
    lineHeight: 28,
  },
  contactInfo: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactIconWrapper: {
    backgroundColor: 'white',
    padding: 4,
    borderRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contactIcon: {
    width: 30,
    height: 30,
  },
  contactText: {
    fontSize: 12,
    color: '#444653',
  },
});

export default LandingPage;
