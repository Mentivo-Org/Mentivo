import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import ChatPage from './chat/ChatPage';
import DialogBox from '../components/DialogBox';
import { useCall } from '../context/CallContext';
import { resetToScreen } from '../services/navigation';
import { Routes } from '../constants/routes';

// Figma assets
const imgIconstackIoProfileCircle = require('../app-assets/profile-circle.svg');
const imgMic = require('../app-assets/mic-off.svg');
const imgEndCall = require('../app-assets/hangup.svg');
const imgSpeaker = require('../app-assets/speaker.svg');

const InCallScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { callId, channelName, callerName, role, initialToken, mentorPhoto } = route.params;

  const {
    callId: activeCallId,
    callStatus,
    duration,
    isMuted,
    isSpeakerOn,
    chatSessionId,
    partnerId,
    partnerName,
    startCallSession,
    endCallSession,
    toggleMute,
    toggleSpeaker,
    setMinimized,
    setChatSessionId,
  } = useCall();

  const [isChatModalVisible, setIsChatModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    onClose?: () => void;
  }>({ title: '', message: '' });

  useFocusEffect(
    React.useCallback(() => {
      if ((!callStatus || callStatus === 'ended') && callId !== activeCallId) {
        console.log('[InCallScreen] Stale screen detected, redirecting to Home');
        resetToScreen(Routes.main, { screen: Routes.home });
      }
    }, [callId, activeCallId, callStatus])
  );

  useEffect(() => {
    if (callId && callId !== activeCallId) {
      startCallSession({
        callId,
        channelName,
        callerName,
        role,
        initialToken,
        mentorPhoto,
        chatSessionId: route.params.chatSessionId,
      });
    }
  }, [callId]);

  useEffect(() => {
    const backAction = () => {
      handleMinimize();
      return true; // Prevents default navigation pop
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

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

  const navigateToChat = () => {
    if (chatSessionId) {
      setIsChatModalVisible(true);
    } else {
      setAlertData({
        title: 'Chat Unavailable',
        message: 'Chat is not available for this session.'
      });
      setAlertVisible(true);
    }
  };

  const handleMinimize = () => {
    setMinimized(true);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Minimize Button */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.minimizeButton} onPress={handleMinimize}>
          <Image
            source={require('../app-assets/arrow-back-up.svg')}
            style={styles.backIcon}
            tintColor="#0077CB"
          />
        </TouchableOpacity>
        <View style={styles.topInfo}>
          <Text style={styles.callerName}>{callerName || 'Mentorship Session'}</Text>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        <View style={{ width: 40 }} /> {/* Balance the layout spacing */}
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
            tintColor={isMuted ? '#FFFFFF' : '#0077CB'}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.chatControlButton} onPress={navigateToChat}>
          <Image
            source={require('../app-assets/chat-round.svg')}
            style={styles.iconSmall}
            tintColor="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.endButton} onPress={() => endCallSession(true)}>
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
            tintColor={isSpeakerOn ? '#FFFFFF' : '#0077CB'}
          />
        </TouchableOpacity>
      </View>

      <Modal visible={isChatModalVisible} animationType="slide" onRequestClose={() => setIsChatModalVisible(false)}>
        {chatSessionId && (
          <ChatPage
            inCall={true}
            sessionId={chatSessionId}
            partnerId={partnerId || undefined}
            partnerName={partnerName || callerName}
            onClose={() => setIsChatModalVisible(false)}
          />
        )}
      </Modal>

      <DialogBox
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        onClose={() => {
          setAlertVisible(false);
          alertData.onClose?.();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  minimizeButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  topInfo: {
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    color: '#0077CB',
  },
  callerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0077CB',
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
    backgroundColor: '#0077CB',
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
    backgroundColor: '#0077CB',
  },
  chatControlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0077CB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
  iconSmall: {
    width: 30,
    height: 30,
  },
});

export default InCallScreen;
