import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'blocked' | 'failed';
  timestamp?: number;
  compact?: boolean;
}

const statusIcons: Record<string, any> = {
  sending: require('../../app-assets/clock.svg'),
  sent: require('../../app-assets/check-single.svg'),
  delivered: require('../../app-assets/check-double.svg'),
  read: require('../../app-assets/check-double-blue.svg'),
  blocked: require('../../app-assets/blocked-icon.svg'),
  failed: require('../../app-assets/error-icon.svg'),
};

const statusColors: Record<string, string> = {
  sending: '#9CA3AF',
  sent: '#6B7280',
  delivered: '#2563eb',
  read: '#2563eb',
  blocked: '#FF3B30',
  failed: '#FF3B30',
};

const statusLabels: Record<string, string> = {
  sending: 'Sending...',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  blocked: 'Blocked',
  failed: 'Failed to send',
};

const MessageStatus: React.FC<MessageStatusProps> = ({ 
  status, 
  timestamp,
  compact = false 
}) => {
  const IconSource = statusIcons[status] || statusIcons.sent;
  const color = statusColors[status] || statusColors.sent;
  const label = statusLabels[status] || status;

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Image 
          source={IconSource} 
          style={[styles.compactIcon, { tintColor: color }]} 
        />
        {timestamp && <Text style={[styles.compactTime, { color }]}>{formatTime(timestamp)}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image 
        source={IconSource} 
        style={[styles.icon, { tintColor: color }]} 
      />
      <Text style={[styles.label, { color }]}>{label}</Text>
      {timestamp && <Text style={[styles.time, { color }]}>{formatTime(timestamp)}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  icon: {
    width: 14,
    height: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
  time: {
    fontSize: 9,
    fontWeight: '400',
    opacity: 0.8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  compactIcon: {
    width: 12,
    height: 12,
  },
  compactTime: {
    fontSize: 9,
    fontWeight: '400',
  },
});

export default MessageStatus;