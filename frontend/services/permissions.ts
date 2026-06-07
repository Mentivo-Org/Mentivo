import { PermissionsAndroid, Platform, Alert } from 'react-native';

/**
 * Requests microphone permissions for Android and iOS contextually.
 * Returns true if granted, false otherwise.
 */
export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Mentivo needs access to your microphone so you can talk to your mentor/student.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Microphone permission granted');
        return true;
      } else {
        console.warn('Microphone permission denied');
        Alert.alert(
          'Permission Denied',
          'Microphone access is required for voice calls. Please enable it in your device settings.'
        );
        return false;
      }
    } catch (err) {
      console.warn('Microphone permission error:', err);
      return false;
    }
  } else if (Platform.OS === 'ios') {
    // On iOS, the permission is requested automatically when the microphone is first accessed.
    // However, it's good practice to provide a consistent return for the UI flow.
    return true;
  }
  return true;
};
