import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const QUICK_REPLIES = ['Schedule', 'Update', 'Doubt', 'Thanks!', 'Got it'];

interface QuickRepliesProps {
  onReply: (text: string) => void;
}

const QuickReplies: React.FC<QuickRepliesProps> = ({ onReply }) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          {QUICK_REPLIES.map((reply) => (
            <TouchableOpacity
              key={reply}
              onPress={() => onReply(reply)}
              style={styles.replyButton}
              activeOpacity={0.7}
            >
              <Text style={styles.replyText}>{reply}</Text>
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
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  replyText: {
    fontSize: 12,
    color: '#444653',
    fontWeight: '500',
  },
});

export default QuickReplies;
