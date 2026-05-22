import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Image 
        source={require('../app-assets/bg-pattern.svg')} 
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
      />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../app-assets/logo.svg')} 
            style={styles.logo}
            contentFit="contain"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2563eb', // Fallback blue
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
});

export default SplashScreen;
