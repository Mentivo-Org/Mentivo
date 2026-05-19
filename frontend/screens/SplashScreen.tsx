import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../logo.svg')} 
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.logoText}>Mentivo</Text>
        </View>
        <Text style={styles.tagline}>IITian Guidance, Real Results</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Loading your mentorship experience...</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#00288e',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#444653',
    fontWeight: '500',
    marginTop: 8,
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '400',
  },
});

export default SplashScreen;
