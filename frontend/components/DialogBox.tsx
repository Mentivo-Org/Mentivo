import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';

interface DialogBoxProps {
  visible: boolean;
  title: string;
  message?: string;
  primaryButtonText?: string;
  onPrimaryPress?: () => void;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
  showCloseIcon?: boolean;
  onClose?: () => void;
}

const DialogBox: React.FC<DialogBoxProps> = ({
  visible,
  title,
  message,
  primaryButtonText = "OK",
  onPrimaryPress,
  secondaryButtonText,
  onSecondaryPress,
  showCloseIcon = false,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View style={styles.dialogContainer}>
            {showCloseIcon && (
              <TouchableOpacity 
                style={styles.closeIconContainer} 
                onPress={onClose}
              >
                <Image 
                  source={require('../app-assets/x-icon.svg')} 
                  style={styles.closeIcon}
                  tintColor="#444653"
                />
              </TouchableOpacity>
            )}
            
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
            
            <View style={styles.buttonContainer}>
              {secondaryButtonText && (
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]} 
                  onPress={onSecondaryPress || onClose}
                >
                  <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={onPrimaryPress || onClose}
              >
                <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    paddingTop: 32, // More space for close icon if present
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    position: 'relative',
  },
  closeIconContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 10,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0b1c30',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#444653',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#0077CB',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#c4c5d5',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButtonText: {
    color: '#444653',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DialogBox;
