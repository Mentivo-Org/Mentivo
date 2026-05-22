import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';

const RoleSelection = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('../app-assets/logo.svg')} style={styles.logoIcon} />
          <Text style={styles.logoText}>entivo</Text>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.studentButton}
          onPress={() => navigation.navigate('StudentSignUp')}
        >
          <Text style={styles.studentButtonText}>As Student</Text>
          <Image 
            source={require('../app-assets/arrow-right-white.svg')} 
            style={styles.arrowIcon} 
            tintColor="white"
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.mentorButton}
          onPress={() => navigation.navigate('MentorSignUp')}
        >
          <Text style={styles.mentorButtonText}>As Mentor</Text>
          <Image 
            source={require('../app-assets/arrow-right.svg')} 
            style={styles.arrowIcon} 
            tintColor="#444653"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
  },
  logoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'black',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  studentButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 244,
    height: 48,
    borderRadius: 12,
    marginBottom: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 1.75,
  },
  studentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 16,
  },
  mentorButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 244,
    height: 48,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 1.75,
  },
  mentorButtonText: {
    color: '#444653',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 16,
  },
  arrowIcon: {
    width: 22,
    height: 13,
  },
});

export default RoleSelection;
