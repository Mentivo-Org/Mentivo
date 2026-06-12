import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isKeyboardVisible?: boolean;
  bottomOffset?: number;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  value, 
  onChangeText, 
  onSend,
  isKeyboardVisible,
  bottomOffset = 0
}) => {
  return (
    <View style={[
      styles.container,
      {
        paddingBottom: isKeyboardVisible ? 8 : (bottomOffset > 0 ? bottomOffset : 12)
      }
    ]}>
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="TAP A MESSAGE"
          placeholderTextColor="#A0A0A0"
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          multiline={false}
        />
      </View>
      <TouchableOpacity 
        onPress={onSend}
        style={styles.sendButton}
        activeOpacity={0.7}
      >
        <Image 
          source={require('../../app-assets/send-icon.svg')}
          style={{ width: 24, height: 24 }}
          tintColor="#444653"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 22.5,
    height: 45,
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  textInput: {
    color: '#444653',
    fontSize: 16,
    padding: 0,
  },
  sendButton: {
    backgroundColor: 'white',
    borderRadius: 22.5,
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
});

export default MessageInput;
