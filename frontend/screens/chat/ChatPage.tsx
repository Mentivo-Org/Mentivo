import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Keyboard, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChatClient, ChatMessage as AgoraMessage } from 'react-native-agora-chat';
import { agoraChatService } from '../../services/chat/agoraChatClient';
import { ClientValidation } from '../../services/chat/validation';
import { chatSessionManager } from '../../services/chat/chatSessionManager';
import { setActiveChatSession } from '../../services/navigation';
import MessageBubble from '../../components/chat/MessageBubble';
import MessageInput from '../../components/chat/MessageInput';
import QuickReplies from '../../components/chat/QuickReplies';
import ValidationWarning from '../../components/chat/ValidationWarning';
import RateLimitIndicator from '../../components/chat/RateLimitIndicator';
import { useAuth } from '../../services/retrieveKeys';
import { CallEndpoints, MentorEndpoints } from '../../constants/endpoint';
import { requestMicrophonePermission } from '../../services/permissions';
import { useLoading } from '../../context/LoadingContext';
import DialogBox from '../../components/DialogBox';
import api from '../../services/api';

const ChatPage = (props: any) => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params as any;
  const { partnerId, partnerName, sessionId, inCall, onClose } = { 
    ...routeParams, 
    ...props 
  };
  
  const agoraPartnerId = partnerId ? partnerId.replace(/-/g, '').toLowerCase() : '';
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [validationWarning, setValidationWarning] = useState<{ message: string; type: 'error' | 'warning' | 'info' } | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ current: number; limit: number; resetTime?: number } | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const insets = useSafeAreaInsets();
  const { showLoading, hideLoading } = useLoading();
  const { role } = useAuth();
  const isStudent = role === 'student';

  const [partnerPhotoUrl, setPartnerPhotoUrl] = useState<string | null>(routeParams.partnerPhotoUrl || null);

  useEffect(() => {
    if (!partnerPhotoUrl && isStudent && partnerId) {
      const fetchPartnerDetails = async () => {
        try {
          const response = await api.get(MentorEndpoints.getMentorById + partnerId);
          if (response.status === 200 && response.data) {
            const photo = response.data.user?.photo_url || response.data.photo_url || null;
            if (photo) setPartnerPhotoUrl(photo);
          }
        } catch (e) {
          console.error("Failed to fetch partner details:", e);
        }
      };
      fetchPartnerDetails();
    }
  }, [partnerId, isStudent, partnerPhotoUrl]);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '' });

  useEffect(() => {
    // Register this session as active so notifications are suppressed while viewing
    setActiveChatSession(sessionId);

    const initChat = async () => {
      await agoraChatService.init();
      setIsConnecting(false);
      loadHistory();
      
      // Mark as read when entering the chat
      try {
        await chatSessionManager.markAsRead(sessionId);
      } catch (e) {
        console.error('Mark As Read Error:', e);
      }
    };

    initChat();

    const messageListener = {
      onMessagesReceived(receivedMessages: AgoraMessage[]) {
        const newMsgs = receivedMessages
          .filter(m => m.from === agoraPartnerId)
          .map(m => ({
            id: m.msgId,
            content: (m.body as any).content || (m.body as any).msg || '',
            isSender: false,
            senderName: partnerName,
            timestamp: m.serverTime
          }));
        
        if (newMsgs.length > 0) {
          setMessages(prev => [...prev, ...newMsgs]);
        }
      },
    };

    agoraChatService.addMessageListener(messageListener);
    return () => {
      // Clear the active session when leaving so notifications resume
      setActiveChatSession(null);
      agoraChatService.removeMessageListener(messageListener);
    };
  }, [partnerId]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleCallNow = async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setAlertData({
        title: 'Permission Denied',
        message: 'Microphone access is required for voice calls. Please enable it in your device settings.'
      });
      setAlertVisible(true);
      return;
    }

    setIsInitiating(true);
    showLoading('Initiating call...');
    try {
      const response = await api.post(CallEndpoints.initiate, { mentorId: partnerId });
      
      if (response.status === 200) {
        const { sessionId, channelName, studentToken, maxDurationSeconds, mentorPhoto, chatSessionId } = response.data;
        
        navigation.navigate('InCall', {
          callId: sessionId,
          channelName,
          callerName: partnerName,
          role: 'caller',
          initialToken: studentToken,
          maxDuration: maxDurationSeconds,
          mentorPhoto: mentorPhoto || null,
          chatSessionId
        });
      }
    } catch (error: any) {
      console.error('Failed to initiate call:', error);
      const errorMsg = error.response?.data?.error || 'Failed to connect. Please try again.';
      setAlertData({ title: 'Call Error', message: errorMsg });
      setAlertVisible(true);
    } finally {
      setIsInitiating(false);
      hideLoading();
    }
  };

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (isStudent && partnerId) {
      const checkFavoriteStatus = async () => {
        try {
          const response = await api.get(MentorEndpoints.getFavoriteMentors);
          if (response.status === 200 && Array.isArray(response.data)) {
            const isFav = response.data.some((m: any) => m.mentorId === partnerId);
            setIsFavorite(isFav);
          }
        } catch (e) {
          console.error("Failed to fetch favorite mentors:", e);
        }
      };
      checkFavoriteStatus();
    }
  }, [partnerId, isStudent]);

  const toggleFavorite = async () => {
    try {
      const newStatus = !isFavorite;
      setIsFavorite(newStatus);
      await api.post(`${MentorEndpoints.toggleFavoriteMentor}${partnerId}/favorite`);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setIsFavorite(isFavorite); // Revert on failure
    }
  };

  const loadHistory = async () => {
    const normalizeId = (id: string | null | undefined) => id ? id.replace(/-/g, '').toLowerCase() : '';
    const normPartnerId = normalizeId(partnerId);

    try {
      const dbMessages = await chatSessionManager.getMessages(sessionId);
      const history = dbMessages.map((m: any) => {
        const normSenderId = normalizeId(m.senderId);
        const isPartner = normSenderId === normPartnerId;
        return {
          id: m.agoraMsgId,
          content: m.content,
          isSender: !isPartner,
          senderName: isPartner ? partnerName : 'You',
          timestamp: new Date(m.createdAt).getTime()
        };
      });
      setMessages(history.reverse());
    } catch (e) {
      console.error('Fetch History Error:', e);
      // Fallback to Agora local history if backend fails
      try {
        const msgs = await ChatClient.getInstance().chatManager.fetchHistoryMessages(agoraPartnerId, { direction: 0, pageSize: 50 });
        const agoraHistory = msgs.list.map(m => {
          const normFrom = normalizeId(m.from);
          const isPartner = normFrom === normPartnerId;
          return {
            id: m.msgId,
            content: (m.body as any).content || (m.body as any).msg || '',
            isSender: !isPartner,
            senderName: isPartner ? partnerName : 'You',
            timestamp: m.serverTime
          };
        });
        setMessages(agoraHistory.reverse());
      } catch (ae) {
        console.error('Agora Fetch History Error:', ae);
      }
    }
  };

  const handleSend = async (textOverride?: string) => {
    if (isStudent && !textOverride) return;
    
    const textToSend = textOverride || inputText;
    if (!textToSend.trim()) return;

    const validation = ClientValidation.validateBeforeSend(textToSend);
    if (!validation.isValid) {
      setValidationWarning({ message: validation.violations[0].message, type: 'error' });
      return;
    }

    // Create a temporary message for optimistic UI update
    const tempId = Date.now().toString();
    
    try {
      setMessages(prev => [...prev, {
        id: tempId,
        content: textToSend,
        isSender: true,
        senderName: 'You',
        timestamp: Date.now(),
        status: 'sending'
      }]);
      if (!textOverride) setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

      // Send to backend
      const result = await chatSessionManager.sendMessage(sessionId, textToSend);
      
      // Update optimistic message with real ID and status
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: result.agoraMsgId, status: 'sent' } : m));

    } catch (e: any) {
      console.error('Send Message Error:', e);
      const errorMsg = e.response?.data?.error || 'Failed to send message';
      const violations = e.response?.data?.violations;
      
      if (violations && violations.length > 0) {
        setValidationWarning({ message: violations[0].message, type: 'error' });
      } else {
        setValidationWarning({ message: errorMsg, type: 'error' });
      }
      
      // Update rate limit info if available
      if (e.response?.data?.rateLimit) {
        setRateLimitInfo(e.response.data.rateLimit);
      }
      
      // Remove the optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.container}>
        <Image
          source={require('../../app-assets/chat-bg.svg')}
          style={StyleSheet.absoluteFillObject}
          contentFit="fill"
        />
        {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onClose ? onClose() : navigation.goBack()} style={styles.backButton}>
          <Image 
            source={require('../../app-assets/arrow-back-up.svg')}
            style={{ width: 24, height: 24 }}
            tintColor="white"
          />
        </TouchableOpacity>
        <View style={styles.headerProfile}>
          <Image 
            source={partnerPhotoUrl ? { uri: partnerPhotoUrl } : require('../../app-assets/profile-circle.svg')}
            style={styles.profileIcon}
            tintColor={partnerPhotoUrl ? undefined : 'white'}
          />
          <Text style={styles.headerTitle}>{partnerName}</Text>
        </View>
        {isStudent && (
          <TouchableOpacity onPress={toggleFavorite} style={styles.headerFavoriteButton}>
            <Image 
              source={require('../../app-assets/heart-icon.svg')}
              style={{ width: 24, height: 24, opacity: isFavorite ? 1.0 : 0.4 }}
              tintColor={isFavorite ? '#ef4444' : 'white'}
            />
          </TouchableOpacity>
        )}
        {isStudent && (
          <TouchableOpacity onPress={handleCallNow} style={styles.callButton} disabled={isInitiating}>
            <Image 
              source={require('../../app-assets/phone-icon.svg')}
              style={{ width: 24, height: 24 }}
              tintColor="#2563eb"
            />
          </TouchableOpacity>
        )}
      </View>

      {validationWarning && (
        <ValidationWarning 
          message={validationWarning.message} 
          type={validationWarning.type}
          onDismiss={() => setValidationWarning(null)}
        />
      )}

      {rateLimitInfo && (
        <RateLimitIndicator 
          current={rateLimitInfo.current}
          limit={rateLimitInfo.limit}
          resetTime={rateLimitInfo.resetTime}
          compact
        />
      )}

      {/* Messages */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Image 
          source={require('../../app-assets/bg-pattern.svg')}
          style={styles.bgPattern}
        />
        
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MessageBubble 
              content={item.content}
              isSender={item.isSender}
              senderName={item.senderName}
              timestamp={item.timestamp}
              status={item.status}
            />
          )}
          contentContainerStyle={styles.flatListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {!isStudent && (
          <MessageInput 
            value={inputText}
            onChangeText={setInputText}
            onSend={() => handleSend()}
            isKeyboardVisible={isKeyboardVisible}
            bottomOffset={!isKeyboardVisible && !isStudent ? insets.bottom : 0}
          />
        )}
        
        {!isKeyboardVisible && isStudent && (
          <QuickReplies 
            onReply={(text) => handleSend(text)} 
            bottomOffset={insets.bottom}
          />
        )}
      </KeyboardAvoidingView>

      <DialogBox
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        onPrimaryPress={() => setAlertVisible(false)}
        primaryButtonText="OK"
        onClose={() => setAlertVisible(false)}
      />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  profileIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  headerFavoriteButton: {
    marginRight: 60,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 60,
    height: 44,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  bgPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.1,
  },
  flatListContent: {
    padding: 16,
    paddingBottom: 20,
  },
});

export default ChatPage;
