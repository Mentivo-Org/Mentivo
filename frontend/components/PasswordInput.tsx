import React, { useCallback, useImperativeHandle, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface PasswordInputProps {
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  style?: object;
  inputStyle?: object;
  [key: string]: any;
}

/**
 * PasswordInput — fully uncontrolled to eliminate per-keystroke re-render flicker.
 *
 * Root cause of the flicker: using `value={state}` on a TextInput makes it a
 * "controlled" input. Every keystroke calls setState on the parent → parent
 * re-renders → the whole screen tree re-renders → React Native briefly shows the
 * native character before React overwrites it with the new state value = flicker.
 *
 * Fix: Remove the `value` prop entirely. The TextInput manages its own native value.
 * Use `defaultValue` for the initial value and `onChangeText` purely as a callback
 * to notify the parent — no state update needed on the parent side.
 *
 * Parent screens should use `useRef<string>("")` to track the current value, and
 * only read it on form submit. This means ZERO re-renders while typing.
 */

const EyeToggle = React.memo(({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) => (
  <TouchableOpacity onPress={onToggle} style={styles.eyeButton}>
    <Ionicons
      name={visible ? 'eye' : 'eye-off'}
      size={20}
      color="#2563eb"
    />
  </TouchableOpacity>
));

export const PasswordInput = React.memo(function PasswordInput({
  defaultValue = '',
  onChangeText,
  placeholder = '••••••••',
  style,
  inputStyle,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleToggle = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return (
    <View style={[styles.passwordContainer, style]}>
      <TextInput
        style={[styles.passwordInput, inputStyle]}
        placeholder={placeholder}
        secureTextEntry={!showPassword}
        placeholderTextColor="rgba(68,70,83,0.5)"
        defaultValue={defaultValue}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        underlineColorAndroid="transparent"
        {...props}
      />
      <EyeToggle visible={showPassword} onToggle={handleToggle} />
    </View>
  );
});

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
