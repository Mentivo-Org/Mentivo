import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const QUICK_REPLIES = [
  { text: 'Schedule', bg: '#a4bdf5', color: '#163b8c' },
  { text: 'Update', bg: '#a4f5ba', color: '#168c30' },
  { text: 'Doubt', bg: '#f5e2a4', color: '#8c6a16' },
  { text: 'Thanks!', bg: '#f5a4ac', color: '#8c164f' },
  { text: 'Got it', bg: '#a4bdf5', color: '#163b8c' }
];

interface QuickRepliesProps {
  onReply: (text: string) => void;
  bottomOffset?: number;
}

const QuickReplies: React.FC<QuickRepliesProps> = ({ onReply, bottomOffset = 0 }) => {
  return (
    <View style={[
      styles.container,
      {
        marginBottom: bottomOffset > 0 ? bottomOffset : 8
      }
    ]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          {QUICK_REPLIES.map((reply) => (
            <TouchableOpacity
              key={reply.text}
              onPress={() => onReply(reply.text)}
              style={[styles.replyButton, { backgroundColor: reply.bg }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.replyText, { color: reply.color }]}>{reply.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
  },
  replyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  replyText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default QuickReplies;
