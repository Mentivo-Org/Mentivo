import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChatClient, ChatMessage as AgoraMessage } from 'react-native-agora-chat';
import { agoraChatService } from '../../services/chat/agoraChatClient';
import { ClientValidation } from '../../services/chat/validation';
import { chatSessionManager } from '../../services/chat/chatSessionManager';
import MessageBubble from '../../components/chat/MessageBubble';
import MessageInput from '../../components/chat/MessageInput';
import QuickReplies from '../../components/chat/QuickReplies';
import ValidationWarning from '../../components/chat/ValidationWarning';
import RateLimitIndicator from '../../components/chat/RateLimitIndicator';

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

  useEffect(() => {
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
    return () => agoraChatService.removeMessageListener(messageListener);
  }, [partnerId]);

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
    <SafeAreaView style={styles.container}>
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
            source={require('../../app-assets/profile-circle.svg')}
            style={styles.profileIcon}
            tintColor="white"
          />
          <Text style={styles.headerTitle}>{partnerName}</Text>
        </View>
        <TouchableOpacity style={styles.favoriteButton}>
          <Image 
            source={require('../../app-assets/heart-icon.svg')}
            style={{ width: 20, height: 20 }}
            tintColor="white"
          />
        </TouchableOpacity>
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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

        <QuickReplies onReply={(text) => handleSend(text)} />
        <MessageInput 
          value={inputText}
          onChangeText={setInputText}
          onSend={() => handleSend()}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
    width: 36,
    height: 36,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  favoriteButton: {
    padding: 8,
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
