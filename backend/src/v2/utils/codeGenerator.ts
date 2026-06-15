import crypto from 'crypto';

/**
 * Generates a unique alphanumeric code for coaching centers.
 * Format: MENT-<RANDOM_6_CHARS> (e.g., MENT-A1B2C3)
 */
export const generateCoachingCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'MENT-';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
};
