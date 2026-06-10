import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { joinChannel, leaveChannel, getAgoraEngine, setSpeakerphoneOn } from '../services/agora';
import api from '../services/api';
import { socketManager } from '../services/socketManager';
import { CallEndpoints } from '../constants/endpoint';
import { requestMicrophonePermission } from '../services/permissions';
import notifee from '@notifee/react-native';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

// Figma assets
const imgIconstackIoProfileCircle = require('../app-assets/profile-circle.svg');
const imgMic = require('../app-assets/mic-off.svg');
const imgEndCall = require('../app-assets/hangup.svg');
const imgSpeaker = require('../app-assets/speaker.svg');

const InCallScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { callId, channelName: initialChannelName, callerName, role, initialToken, mentorPhoto } = route.params;

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [callStatus, setCallStatus] = useState<'calling' | 'ringing' | 'active'>(role === 'caller' ? 'calling' : 'active');
  const callStatusRef = useRef(callStatus);
  const isEndingCallRef = useRef(false);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Listen for remote hangup or status changes
    const statusHandler = (data: any) => {
      if (data.callId === callId) {
        if (data.status === 'completed' || data.status === 'rejected' || data.status === 'missed') {
          console.log(`[Socket] Call ${data.status} remotely`);
          notifee.cancelNotification(callId).catch(err => console.error('Failed to cancel notification:', err));
          if (handleEndCallRef.current) handleEndCallRef.current(false, data.status);
        } else if (data.status === 'ringing' && callStatusRef.current === 'calling') {
          console.log('[Socket] Mentor phone is ringing');
          setCallStatus('ringing');
        } else if (data.status === 'active' && callStatusRef.current !== 'active') {
          console.log('[Socket] Call is now active');
          setCallStatus('active');
          if (!timerRef.current) startTimer();
        }
      }
    };

    socketManager.on('call_status_changed', statusHandler);

    const startCall = async () => {
      try {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          handleEndCall(true);
          return;
        }

        // Validate call is still active before joining
        try {
          const statusRes = await api.get(CallEndpoints.status(callId));
          if (isEndingCallRef.current) return;

          const callStatus = statusRes.data.status;
          if (!['calling', 'ringing', 'active'].includes(callStatus)) {
            Alert.alert('Call Ended', 'This call is no longer active.');
            navigation.navigate("Main", {screen: "Home"});
            return;
          }
        } catch (e) {
          if (isEndingCallRef.current) return;
          console.error('Failed to verify call status:', e);
          Alert.alert('Error', 'Could not verify call status.');
          navigation.navigate("Main", {screen: "Home"});
          return;
        }

        let token = initialToken;
        let channelName = initialChannelName;

        // If callee (mentor) and we don't have token, fetch it
        if (role === 'callee' && !token) {
          const response = await api.get(CallEndpoints.token(callId));
          if (isEndingCallRef.current) return;
          token = response.data.token;
          channelName = response.data.channelName;
        }

        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        if (isEndingCallRef.current) return;
        const uid = user?.id || Math.floor(Math.random() * 10000).toString();

        const engine = getAgoraEngine();
        
        // Setup listeners
        engine.addListener('onJoinChannelSuccess', async (connection, elapsed) => {
          console.log('Joined channel successfully');
          setIsConnected(true);
          
          // Display ongoing call notification
          try {
            await notifee.displayNotification({
              title: 'Call in Progress',
              body: `Connected with ${callerName || 'Mentorship Session'}`,
              android: {
                channelId: 'ongoing_calls',
                ongoing: true,
                onlyAlertOnce: true,
                pressAction: { id: 'default', launchActivity: 'default' },
              },
              data: { callId, screen: 'InCall' },
            });
          } catch (e) {
            console.error('Failed to show ongoing call notification:', e);
          }
          
          // If we are the callee, we should notify backend and start timer immediately
          if (role === 'callee') {
            setCallStatus('active');
            startTimer();
            notifyCallStart();
          }
        });

        engine.addListener('onUserJoined', (connection, remoteUid, elapsed) => {
          console.log('Remote user joined', remoteUid);
          setCallStatus('active');
          if (!timerRef.current) startTimer();
        });

        engine.addListener('onUserOffline', (connection, remoteUid, reason) => {
          console.log('Remote user went offline', remoteUid);
          if (handleEndCallRef.current) handleEndCallRef.current(true);
        });

        engine.addListener('onError', (err, msg) => {
          console.error('Agora Error:', err, msg);
          Alert.alert('Call Error', 'An error occurred during the call.');
          if (handleEndCallRef.current) handleEndCallRef.current(true);
        });

        await joinChannel(token, channelName, uid);
      } catch (error) {
        if (isEndingCallRef.current) return;
        console.error('Failed to start call:', error);
        Alert.alert('Error', 'Failed to join the call.');
        navigation.navigate("Main", {screen: "Home"});
      }
    };

    startCall();

    return () => {
      stopTimer();
      stopHeartbeat();
      leaveChannel();
      socketManager.off('call_status_changed', statusHandler);
    };
  }, [callId]);

  const notifyCallStart = async () => {
    try {
      await api.post(CallEndpoints.start(callId));
      startHeartbeat();
    } catch (error) {
      console.error('Failed to notify call start:', error);
    }
  };

  const startTimer = () => {
    if (timerRef.current) return;
    console.log('[Timer] Starting session timer');
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startHeartbeat = () => {
    heartbeatRef.current = setInterval(async () => {
      try {
        await api.patch(CallEndpoints.heartbeat(callId));
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 10000); // Every 10 seconds
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
  };

  const handleEndCallRef = useRef<any>(null);

  const handleEndCall = async (notifyBackend = true, remoteStatus?: string) => {
    if (isEndingCallRef.current) {
      console.log('[handleEndCall] Already in progress, ignoring duplicate call');
      return;
    }
    isEndingCallRef.current = true;

    stopTimer();
    stopHeartbeat();
    leaveChannel();
    
    // Cancel ongoing notification
    try {
      await notifee.cancelNotification(callId);
    } catch (e) {
      console.error('Failed to cancel ongoing notification:', e);
    }
    
    const currentStatus = callStatusRef.current;
    // Consider call completed if it was active OR if there was any duration recorded OR if backend says it's completed
    const wasConnected = currentStatus === 'active' || duration > 0 || remoteStatus === 'completed';
    let finalStatus = wasConnected ? 'completed' : 'cancelled';
    
    console.log(`[handleEndCall] notifyBackend=${notifyBackend}, role=${role}, currentStatus=${currentStatus}, duration=${duration}, wasConnected=${wasConnected}, remoteStatus=${remoteStatus}, finalStatus=${finalStatus}`);
    
    if (notifyBackend) {
      try {
        const response = await api.post(CallEndpoints.end(callId));
        // If the backend specifically returns completed, we trust it
        if (response.data?.status === 'completed') finalStatus = 'completed';
      } catch (error: any) {
        // If backend returns 400, it's likely already ended by the other party.
        // We don't change finalStatus back to cancelled if wasConnected was true.
        console.log('[handleEndCall] Backend /end notification handled:', error.response?.status || error.message);
      }
    }

    if (role === 'caller' && finalStatus === 'completed') {
      console.log('[handleEndCall] Navigating to RatingScreen');
      navigation.replace('RatingScreen', { 
        callId, 
        mentorName: callerName || 'Mentor',
        mentorPhoto: mentorPhoto
      });
    } else {
      if (role === 'caller' && remoteStatus === 'rejected') {
        Alert.alert('Call Rejected', `${callerName || 'Mentor'} rejected the call.`);
      }
      console.log('[handleEndCall] Navigating to Home');
      navigation.navigate("Main", {screen: "Home"});
    }
  };

  useEffect(() => {
    handleEndCallRef.current = handleEndCall;
  }, [handleEndCall]);

  const toggleMute = () => {
    const nextMute = !isMuted;
    getAgoraEngine().muteLocalAudioStream(nextMute);
    setIsMuted(nextMute);
  };

  const toggleSpeaker = () => {
    const nextSpeaker = !isSpeakerOn;
    setSpeakerphoneOn(nextSpeaker);
    setIsSpeakerOn(nextSpeaker);
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topInfo}>
        <Text style={styles.callerName}>{callerName || 'Mentorship Session'}</Text>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      <View style={styles.profileContainer}>
        <View style={styles.profileCircle}>
          <Image
            source={
              role === 'caller' && mentorPhoto 
                ? { uri: mentorPhoto } 
                : imgIconstackIoProfileCircle
            }
            style={role === 'caller' && mentorPhoto ? styles.profileImageReal : styles.profileImage}
            contentFit="cover"
          />
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, isMuted && styles.activeControl]} 
          onPress={toggleMute}
        >
          <Image 
            source={imgMic} 
            style={styles.icon} 
            tintColor={isMuted ? "#FFFFFF" : "#2563eb"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.endButton} onPress={() => handleEndCall(true)}>
          <Image 
            source={imgEndCall} 
            style={styles.icon} 
            tintColor="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, isSpeakerOn && styles.activeControl]} 
          onPress={toggleSpeaker}
        >
          <Image 
            source={imgSpeaker} 
            style={styles.icon} 
            tintColor={isSpeakerOn ? "#FFFFFF" : "#2563eb"} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  topInfo: {
    alignItems: 'center',
    marginTop: 24,
  },
  statusText: {
    fontSize: 12,
    color: '#2563eb',
  },
  callerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  profileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -80,
  },
  profileCircle: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  profileImage: {
    width: 164,
    height: 164,
    borderRadius: 82,
  },
  profileImageReal: {
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: '#e2e8f0',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingBottom: 60,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeControl: {
    backgroundColor: '#2563eb',
  },
  endButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  icon: {
    width: 50,
    height: 50,
  },
});

export default InCallScreen;
