import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const imgArrowRightWhite = "https://www.figma.com/api/mcp/asset/540c48da-fbe4-4ef1-98e5-e8a180978224";
const imgArrowRightBlue = "https://www.figma.com/api/mcp/asset/b4bfd74e-29b3-43e5-a24a-27522df1a823";

const RoleSelection = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('../logo.svg')} style={styles.logoIcon} />
          <Text style={styles.logoText}>entivo</Text>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.studentButton}
          onPress={() => navigation.navigate('StudentSignUp')}
        >
          <Text style={styles.studentButtonText}>As Student</Text>
          <Image source={{ uri: imgArrowRightWhite }} style={styles.arrowIcon} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.mentorButton}
          onPress={() => navigation.navigate('MentorSignUp')}
        >
          <Text style={styles.mentorButtonText}>As Mentor</Text>
          <Image source={{ uri: imgArrowRightBlue }} style={styles.arrowIcon} />
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
    width: 13,
    height: 14,
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
