import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InCallManager from 'react-native-incall-manager';
import notifee from '@notifee/react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';
import { socketManager } from '../services/socketManager';
import { CallEndpoints } from '../constants/endpoint';
import { requestMicrophonePermission } from '../services/permissions';

const IncomingCallScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { callId, channelName, callerName } = route.params;

  useEffect(() => {
    // Keep screen on during incoming call
    InCallManager.setKeepScreenOn(true);

    // Cancel the background notification sound if it exists
    if (callId) {
      notifee.cancelNotification(callId).catch(err => console.error('Failed to cancel notification:', err));
    }

    // Start playing ringtone
    InCallManager.startRingtone('_BUNDLE_');
    InCallManager.setForceSpeakerphoneOn(false);

    // Notify backend that phone is ringing
    const notifyRinging = async () => {
      try {
        await api.post(CallEndpoints.ringing(callId));
      } catch (error) {
        console.error('Failed to notify ringing status:', error);
      }
    };
    notifyRinging();

    // Listen for remote cancellation or timeout
    const statusHandler = (data: any) => {
      if (data.callId === callId && (data.status === 'completed' || data.status === 'rejected' || data.status === 'missed')) {
        console.log('[Socket] Incoming call closed remotely:', data.status);
        InCallManager.stopRingtone();
        InCallManager.setKeepScreenOn(false);
        navigation.goBack();
      }
    };

    socketManager.on('call_status_changed', statusHandler);

    return () => {
      InCallManager.stopRingtone();
      InCallManager.setKeepScreenOn(false);
      socketManager.off('call_status_changed', statusHandler);
    };
  }, [callId]);

  const handleAccept = async () => {
    const hasPermission = await requestMicrophonePermission();
    
    if (!hasPermission) {
      handleReject();
      return;
    }

    InCallManager.stopRingtone();
    // Navigate to InCallScreen which will handle joining the Agora channel
    navigation.replace('InCall', { callId, channelName, callerName, role: 'callee' });
  };

  const handleReject = async () => {
    InCallManager.stopRingtone();
    try {
      await api.post(CallEndpoints.reject(callId));
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.callingText}>Incoming Call</Text>
        <Text style={styles.callerName}>{callerName}</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.rejectButton]} 
            onPress={handleReject}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.acceptButton]} 
            onPress={handleAccept}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        </View>
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
  callingText: {
    color: '#AAAAAA',
    fontSize: 18,
    marginBottom: 10,
  },
  callerName: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 50,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  acceptButton: {
    backgroundColor: '#4CD964',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default IncomingCallScreen;
