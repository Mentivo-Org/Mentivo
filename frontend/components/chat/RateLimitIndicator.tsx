import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RateLimitIndicatorProps {
  current: number;
  limit: number;
  resetTime?: number; // Unix timestamp when limit resets
  compact?: boolean;
}

const RateLimitIndicator: React.FC<RateLimitIndicatorProps> = ({ 
  current, 
  limit, 
  resetTime,
  compact = false 
}) => {
  const percentage = Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactBar}>
          <View 
            style={[
              styles.compactFill,
              { width: `${percentage}%` },
              isNearLimit && !isAtLimit && styles.compactWarningFill,
              isAtLimit && styles.compactDangerFill,
            ]}
          />
        </View>
        <Text style={[styles.compactText, isAtLimit && styles.dangerText]}>
          {current}/{limit}
        </Text>
      </View>
    );
  }

  const getResetTimeText = () => {
    if (!resetTime) return '';
    const now = Date.now();
    const diff = resetTime - now;
    if (diff <= 0) return 'Limit resets soon';
    
    const mins = Math.ceil(diff / 60000);
    if (mins < 1) return 'Resets in a few seconds';
    if (mins === 1) return 'Resets in 1 minute';
    return `Resets in ${mins} minutes`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, isNearLimit && styles.warningLabel]}>
          Message Rate Limit
        </Text>
        <Text style={[styles.count, isAtLimit && styles.dangerCount]}>
          {current} / {limit} messages
        </Text>
      </View>
      <View style={styles.barContainer}>
        <View style={styles.bar}>
          <View 
            style={[
              styles.fill,
              { width: `${percentage}%` },
              isNearLimit && !isAtLimit && styles.warningFill,
              isAtLimit && styles.dangerFill,
            ]}
          />
        </View>
      </View>
      {resetTime && (
        <Text style={styles.resetText}>{getResetTimeText()}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444653',
  },
  warningLabel: {
    color: '#FF9F0A',
  },
  count: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  dangerCount: {
    color: '#FF3B30',
  },
  barContainer: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: 'transparent',
  },
  fill: {
    height: '100%',
    backgroundColor: '#0077CB',
    borderRadius: 3,
  },
  warningFill: {
    backgroundColor: '#FF9F0A',
  },
  dangerFill: {
    backgroundColor: '#FF3B30',
  },
  resetText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'right',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactFill: {
    height: '100%',
    backgroundColor: '#0077CB',
    borderRadius: 2,
  },
  compactWarningFill: {
    backgroundColor: '#FF9F0A',
  },
  compactDangerFill: {
    backgroundColor: '#FF3B30',
  },
  compactText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 45,
  },
  dangerText: {
    color: '#FF3B30',
  },
});

export default RateLimitIndicator;