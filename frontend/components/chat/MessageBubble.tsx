import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MessageStatus from './MessageStatus';

interface MessageBubbleProps {
  content: string;
  isSender: boolean;
  senderName: string;
  timestamp?: number;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'blocked' | 'failed';
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  content, 
  isSender, 
  senderName, 
  timestamp,
  status = 'sent'
}) => {
  return (
    <View style={[styles.bubbleContainer, isSender ? styles.senderAlign : styles.receiverAlign]}>
      <Text style={styles.senderName}>
        {isSender ? 'You' : senderName}
      </Text>
      <View 
        style={[
          styles.bubbleCard, 
          isSender ? styles.senderBubble : styles.receiverBubble
        ]}
      >
        <Text style={[styles.content, isSender ? styles.senderText : styles.receiverText]}>
          {content}
        </Text>
        {isSender && (
          <View style={styles.statusContainer}>
            <MessageStatus 
              status={status} 
              timestamp={timestamp}
              compact
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    marginBottom: 16,
  },
  senderAlign: {
    alignItems: 'flex-end',
  },
  receiverAlign: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: 'white',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  bubbleCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 1.75,
    elevation: 2,
  },
  senderBubble: {
    backgroundColor: 'white',
    shadowOffset: { width: 4, height: 4 },
  },
  receiverBubble: {
    backgroundColor: 'white',
    shadowOffset: { width: -4, height: 4 },
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
  },
  senderText: {
    color: '#444653',
  },
  receiverText: {
    color: '#444653',
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
});

export default MessageBubble;
