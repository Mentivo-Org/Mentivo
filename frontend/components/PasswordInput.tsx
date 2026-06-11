import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export function PasswordInput({ value, onChangeText, placeholder = "••••••••", style, inputStyle, ...props }: any) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <View style={[styles.passwordContainer, style]}>
      <TextInput
        style={[styles.passwordInput, inputStyle]}
        placeholder={placeholder}
        secureTextEntry={!showPassword}
        placeholderTextColor="rgba(68,70,83,0.5)"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        {...props}
      />
      <TouchableOpacity
        onPress={() => setShowPassword(!showPassword)}
        style={styles.eyeButton}
      >
        <Ionicons
          name={showPassword ? "eye" : "eye-off"}
          size={20}
          color="#2563eb"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c4c5d5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#0b1c30',
  },
  eyeButton: {
    marginLeft: 10,
  },
});
