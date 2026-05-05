import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
const LandingPage = () => {

    const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brand}>Mentivo</Text>

            {/* No profile photo, because you are logged out */}
          {/* <TouchableOpacity style={styles.profileButton} activeOpacity={0.8}>
            <Ionicons name="person-circle-outline" size={28} color="#00288e" />
          </TouchableOpacity> */}
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTag}>
            <Text style={styles.heroTagText}>Academic Excellence Awaits</Text>
          </View>
          <Text style={styles.heroTitle}>Learn from IITians</Text>
          <Text style={styles.heroText}>
            Unlock your potential with personalized mentorship from the prestigious IIT community. Bridge the gap between ambition and achievement with expert guidance.
          </Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={()=> navigation.navigate('StudentLogin')}>
              <Text style={styles.primaryButtonText}>I am a Student</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={styles.buttonIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
              <Text style={styles.secondaryButtonText}>I am a Mentor</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.card, styles.featureCard]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.featureTitle}>Direct Access</Text>
                <Text style={styles.featureText}>Connect directly with students and alumni from India's top engineering institutes.</Text>
              </View>
              <Ionicons name="share-social-outline" size={26} color="#00288e" />
            </View>
            <View style={styles.tagsRow}>
              <View style={styles.chip}><Text style={styles.chipText}>JEE Prep</Text></View>
              <View style={styles.chip}><Text style={styles.chipText}>Career Growth</Text></View>
              <View style={styles.chip}><Text style={styles.chipText}>Research</Text></View>
            </View>
          </View>

          <View style={[styles.card, styles.darkCard]}>
            <Text style={styles.darkCardTitle}>Smart Scheduling</Text>
            <Text style={styles.darkCardText}>Seamlessly book sessions that fit both your schedules perfectly.</Text>
          </View>

          <View style={[styles.card, styles.paleCard]}> 
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={24} color="#00288e" />
            </View>
            <Text style={styles.paleCardTitle}>Personalized</Text>
            <Text style={styles.paleCardText}>Curated mentorship plans tailored to your specific academic goals.</Text>
          </View>

          <View style={[styles.card, styles.imageCard]}> 
            <View style={styles.cardOverlay} />
            <Text style={styles.imageCardTitle}>Trust & Prestige</Text>
            <Text style={styles.imageCardText}>Experience the academic rigor and professional standards of the IIT community.</Text>
          </View>
        </View>

        <View style={[styles.card, styles.progressCard]}> 
          <Text style={styles.progressHeading}>Mentorship Progress</Text>
          <Text style={styles.progressSubtitle}>Helping thousands of students reach their dream campus.</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12K+</Text>
              <Text style={styles.statLabel}>SESSIONS</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>SUCCESS RATE</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>450</Text>
              <Text style={styles.statLabel}>IIT MENTORS</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>23</Text>
              <Text style={styles.statLabel}>IIT CAMPUSES</Text>
            </View>
          </View>

          <View style={styles.progressBarBackground}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        <View style={styles.footer}> 
          <Text style={styles.footerBrand}>IIT MENTORS</Text>
          <Text style={styles.footerText}>© 2026 IIT Mentorship Platform. All excellence reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: '#0b1c30',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  heroCard: {
    backgroundColor: '#eff4ff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  heroTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#dce9ff',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  heroTagText: {
    color: '#004666',
    fontSize: 14,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#0b1c30',
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 48,
    letterSpacing: -0.8,
    marginBottom: 18,
  },
  heroText: {
    color: '#444653',
    fontSize: 16,
    lineHeight: 28,
    marginBottom: 24,
  },
  buttonGroup: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#00288e',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#00288e',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#00288e',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  featureCard: {
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureTitle: {
    color: '#00288e',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 10,
  },
  featureText: {
    color: '#444653',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: '92%',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#dce9ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '700',
  },
  darkCard: {
    backgroundColor: '#00288e',
    borderColor: '#00288e',
  },
  darkCardTitle: {
    color: '#a8b8ff',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 12,
  },
  darkCardText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  paleCard: {
    backgroundColor: '#d3e4fe',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  paleCardTitle: {
    color: '#0b1c30',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 12,
    textAlign: 'center',
  },
  paleCardText: {
    color: '#444653',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  imageCard: {
    backgroundColor: '#1f2937',
    borderColor: '#1f2937',
    overflow: 'hidden',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  imageCardTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 12,
  },
  imageCardText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    lineHeight: 24,
  },
  progressCard: {
    backgroundColor: '#ffffff',
  },
  progressHeading: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0b1c30',
    lineHeight: 42,
    marginBottom: 8,
  },
  progressSubtitle: {
    color: '#444653',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  statItem: {
    width: '47%',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#00288e',
    lineHeight: 48,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#444653',
    marginTop: 4,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#c9e6ff',
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '75%',
    height: '100%',
    backgroundColor: '#39b8fd',
  },
  footer: {
    marginTop: 8,
    paddingVertical: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerBrand: {
    color: '#1e3a8a',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.9,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
});

export default LandingPage;
