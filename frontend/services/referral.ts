import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Clipboard from 'expo-clipboard';
import { storage } from './storage';

/**
 * Single owner of the `referredByCode` storage key.
 *
 * A referral has to survive the gap between install and signup, which can span
 * several app opens. The channels it arrives on are lossy — the clipboard gets
 * overwritten, a deep-link URL is gone once handled — so the code is captured at
 * launch and persisted, rather than being detected on the signup screen.
 */

const MENTIVO_PREFIX = /^MENTIVO-/i;
const REFERRER_PATTERN = /MENTIVO-([A-Z0-9]+)/i;

/**
 * Casing is preserved: the backend matches with an exact
 * `findFirst({ where: { referralCode } })`.
 */
const normalize = (rawCode: string): string | null => {
  const code = rawCode.trim().replace(MENTIVO_PREFIX, '').trim();
  return code || null;
};

export const getStoredReferralCode = async (): Promise<string | null> => {
  try {
    return await storage.getItem('referredByCode');
  } catch (err) {
    console.error('[Referral] Failed to read stored referral code:', err);
    return null;
  }
};

/**
 * `force` is for explicit user actions (a deep link) only. Auto-detected codes are
 * first-write-wins, so a stale clipboard can't clobber a code we already hold.
 */
export const saveReferralCode = async (
  rawCode: string,
  { force = false }: { force?: boolean } = {}
): Promise<string | null> => {
  const code = normalize(rawCode);
  if (!code) return null;

  try {
    if (!force) {
      const existing = await getStoredReferralCode();
      if (existing) return existing;
    }
    await storage.setItem('referredByCode', code);
    return code;
  } catch (err) {
    console.error('[Referral] Failed to save referral code:', err);
    return null;
  }
};

/**
 * Launch-time auto-detection. Safe to call on every app start — it is a no-op once
 * a code is stored, and every step is individually guarded so a failure here can
 * never break startup.
 */
export const captureReferralCode = async (): Promise<string | null> => {
  try {
    // A signed-in user has nothing to attribute, and skipping here avoids the iOS
    // clipboard-access toast on every launch.
    const accessToken = await storage.getItem('accessToken');
    if (accessToken) return null;

    const existing = await getStoredReferralCode();
    if (existing) return existing;

    let detectedCode: string | null = null;

    if (Platform.OS === 'android') {
      try {
        const referrer = await Application.getInstallReferrerAsync();
        const match = referrer?.match(REFERRER_PATTERN);
        if (match) {
          detectedCode = match[1];
        }
      } catch (err) {
        console.error('[Referral] Failed to get install referrer:', err);
      }
    }

    // Fallback for iOS and side-loaded installs.
    if (!detectedCode) {
      try {
        if (await Clipboard.hasStringAsync()) {
          const content = (await Clipboard.getStringAsync()).trim();
          // Must *start* with the prefix, so unrelated copied text that happens to
          // mention Mentivo isn't mistaken for a referral.
          const match = MENTIVO_PREFIX.test(content) && content.match(REFERRER_PATTERN);
          if (match) {
            detectedCode = match[1];
          }
        }
      } catch (err) {
        console.error('[Referral] Failed to read clipboard:', err);
      }
    }

    return detectedCode ? await saveReferralCode(detectedCode) : null;
  } catch (err) {
    console.error('[Referral] Failed to capture referral code:', err);
    return null;
  }
};
