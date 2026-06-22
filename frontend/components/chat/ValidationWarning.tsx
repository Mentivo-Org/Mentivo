import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';

interface ValidationWarningProps {
  message: string;
  onDismiss: () => void;
  type?: 'error' | 'warning' | 'info';
}

const ValidationWarning: React.FC<ValidationWarningProps> = ({ 
  message, 
  onDismiss, 
  type = 'error' 
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [fadeAnim, onDismiss]);

  const bgColor = type === 'error' ? '#FF3B30' : type === 'warning' ? '#FF9F0A' : '#0077CB';

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColor },
        { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }
      ]}
    >
      <Text style={styles.text} numberOfLines={2}>{message}</Text>
      <TouchableOpacity onPress={onDismiss} style={styles.dismiss}>
        <Text style={styles.dismissText}>Dismiss</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  dismiss: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dismissText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ValidationWarning;