import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import SessionCard from '../../components/SessionCard';

export default function YourSession() {
  const navigation = useNavigation<any>();

  // Mock data for sessions
  const sessions = [
    {
      id: '1',
      name: 'Suraj Jain',
      iit: 'IIT Guwahati',
      branch: 'CSE',
      year: 'Y3',
      rating: 4.6,
      calls: 125,
      duration: '02H 05M',
      isFavorite: true,
    },
    {
      id: '2',
      name: 'Rahman Dakait',
      iit: 'IIT Delhi',
      branch: 'MNC',
      year: 'Y2',
      rating: 4.2,
      calls: 99,
      duration: '07H 54M',
      isFavorite: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../../app-assets/arrow-back-up.svg')} style={styles.backIcon} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image source={require('../../app-assets/logo.svg')} style={styles.logoIcon} />
          <Text style={styles.logoText}>entivo</Text>
        </View>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Your session</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sessions.map((session) => (
          <SessionCard key={session.id} {...session} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 13,
    height: 14,
  },
  logoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'black',
    marginLeft: 2,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
