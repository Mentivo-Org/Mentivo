import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useCall } from '../context/CallContext';
import { navigate } from '../services/navigation';
import { Routes } from '../constants/routes';

export default function FloatingCallBanner() {
  const {
    callId,
    channelName,
    callerName,
    role,
    initialToken,
    mentorPhoto,
    chatSessionId,
    callStatus,
    duration,
    isMinimized,
    setMinimized,
    endCallSession,
  } = useCall();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (callId && isMinimized) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [callId, isMinimized]);

  useEffect(() => {
    if (callStatus === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [callStatus]);

  if (!callId || !isMinimized) return null;

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'calling': return 'Calling...';
      case 'ringing': return 'Ringing...';
      case 'active': return formatDuration(duration);
      default: return 'Connecting...';
    }
  };

  const handleExpand = () => {
    navigate(Routes.inCall, {
      callId,
      channelName,
      callerName,
      role,
      initialToken,
      mentorPhoto,
      chatSessionId,
    });
    setMinimized(false);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.content} onPress={handleExpand} activeOpacity={0.9}>
        <View style={styles.leftContainer}>
          <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
          <View>
            <Text style={styles.callerName} numberOfLines={1}>
              {callerName || 'Ongoing Call'}
            </Text>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>

        <View style={styles.rightContainer}>
          <TouchableOpacity style={styles.restoreButton} onPress={handleExpand}>
            <Text style={styles.restoreText}>Restore</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.endButton} onPress={() => endCallSession(true)}>
            <Image
              source={require('../app-assets/hangup.svg')}
              style={styles.hangupIcon}
              tintColor="white"
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Floating near top (below notch / safe area)
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  content: {
    backgroundColor: '#0b1c30', // Deep Mentivo Blue
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981', // Active Call Green
    marginRight: 10,
  },
  callerName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restoreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  restoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  endButton: {
    backgroundColor: '#ef4444', // Red end call
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hangupIcon: {
    width: 16,
    height: 16,
  },
});
