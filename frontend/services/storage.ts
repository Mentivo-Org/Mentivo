import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Every key this app stores in AsyncStorage. Values are plain strings exactly as
 * AsyncStorage stores them — callers that store JSON (user, stats, favouriteMentors,
 * cachedSettings, pendingCallData) are still responsible for their own
 * JSON.stringify/JSON.parse, same as before. This wrapper only constrains the key
 * so a typo can't silently create a new, disconnected storage slot.
 */
export type StorageKey =
  | 'accessToken'
  | 'refreshToken'
  | 'user'
  | 'role'
  | 'verifiedEmail'
  | 'fcmToken'
  | 'photo_url'
  | 'hasPromptedFullScreenIntent'
  | 'stats'
  | 'favouriteMentors'
  | 'referredByCode'
  | 'cachedSettings'
  | 'pendingCallData'
  | 'pendingCallNavigation';

export const storage = {
  getItem: (key: StorageKey) => AsyncStorage.getItem(key),
  setItem: (key: StorageKey, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: StorageKey) => AsyncStorage.removeItem(key),
  multiRemove: (keys: StorageKey[]) => AsyncStorage.multiRemove(keys),
};
