import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { joinChannel, leaveChannel, getAgoraEngine, setSpeakerphoneOn } from '../services/agora';
import api from '../services/api';
import { socketManager } from '../services/socketManager';
import { CallEndpoints } from '../constants/endpoint';
import { requestMicrophonePermission } from '../services/permissions';

const InCallScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { callId, channelName: initialChannelName, callerName, role, initialToken } = route.params;

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [callStatus, setCallStatus] = useState<'calling' | 'ringing' | 'active'>(role === 'caller' ? 'calling' : 'active');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Listen for remote hangup or status changes
    const statusHandler = (data: any) => {
      if (data.callId === callId) {
        if (data.status === 'completed' || data.status === 'rejected' || data.status === 'missed') {
          console.log(`[Socket] Call ${data.status} remotely`);
          handleEndCall(false);
        } else if (data.status === 'ringing' && callStatus === 'calling') {
          console.log('[Socket] Mentor phone is ringing');
          setCallStatus('ringing');
        } else if (data.status === 'active' && callStatus !== 'active') {
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

        let token = initialToken;
        let channelName = initialChannelName;

        // If callee (mentor) and we don't have token, fetch it
        if (role === 'callee' && !token) {
          const response = await api.get(CallEndpoints.token(callId));
          token = response.data.token;
          channelName = response.data.channelName;
        }

        const userJson = await AsyncStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        const uid = user?.id || Math.floor(Math.random() * 10000).toString();

        const engine = getAgoraEngine();
        
        // Setup listeners
        engine.addListener('onJoinChannelSuccess', (connection, elapsed) => {
          console.log('Joined channel successfully');
          setIsConnected(true);
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
          handleEndCall(true);
        });

        engine.addListener('onError', (err, msg) => {
          console.error('Agora Error:', err, msg);
          Alert.alert('Call Error', 'An error occurred during the call.');
          handleEndCall(true);
        });

        await joinChannel(token, channelName, uid);
      } catch (error) {
        console.error('Failed to start call:', error);
        Alert.alert('Error', 'Failed to join the call.');
        navigation.goBack();
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

  const handleEndCall = async (notifyBackend = true) => {
    stopTimer();
    stopHeartbeat();
    leaveChannel();
    if (notifyBackend) {
      try {
        await api.post(CallEndpoints.end(callId));
      } catch (error) {
        console.error('Failed to end call on backend:', error);
      }
    }
    navigation.goBack();
  };

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
      case 'active': return 'In Call';
      default: return 'Connecting...';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        <Text style={styles.callerName}>{callerName || 'Mentorship Session'}</Text>
        <Text style={styles.timerText}>{formatDuration(duration)}</Text>
        
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.controlButton, isMuted && styles.activeControl]} 
            onPress={toggleMute}
          >
            <Text style={styles.controlText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, isSpeakerOn && styles.activeControl]} 
            onPress={toggleSpeaker}
          >
            <Text style={styles.controlText}>{isSpeakerOn ? 'Earpiece' : 'Speaker'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.endButton} onPress={() => handleEndCall(true)}>
          <Text style={styles.endButtonText}>End Call</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#4CD964',
    fontSize: 18,
    marginBottom: 10,
  },
  callerName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontFamily: 'monospace',
    marginBottom: 60,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 60,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControl: {
    backgroundColor: '#555555',
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  endButton: {
    width: 200,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default InCallScreen;
