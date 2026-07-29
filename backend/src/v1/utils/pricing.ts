import prisma from '../config/db.ts';
import { getCachedAppSettings } from './cache.ts';

export async function getMentorActiveRate(mentorId: string): Promise<{ ratePerMin: number; originalPrice: number | null }> {
  const profile = await prisma.mentorProfile.findUnique({
    where: { mentorId }
  });
  if (!profile) {
    return { ratePerMin: 10, originalPrice: null };
  }
  return getMentorActiveRateByProfile(profile);
}

export async function getMentorActiveRateByProfile(profile: any): Promise<{ ratePerMin: number; originalPrice: number | null }> {
  const configMap = await getCachedAppSettings();

  const level = profile.mentorlevel;
  if (!level) {
    return { ratePerMin: Number(profile.rate_per_min || 10), originalPrice: null };
  }

  const levelPriceKey = `price_${level}`;
  const levelDiscountKey = `discount_${level}`;

  const originalPriceStr = configMap[levelPriceKey];
  const discountPriceStr = configMap[levelDiscountKey];

  const originalPrice = originalPriceStr && !isNaN(Number(originalPriceStr)) ? Number(originalPriceStr) : Number(profile.rate_per_min || 10);
  const discountPrice = discountPriceStr && !isNaN(Number(discountPriceStr)) && discountPriceStr.trim() !== '' ? Number(discountPriceStr) : null;

  if (discountPrice !== null) {
    return { ratePerMin: discountPrice, originalPrice };
  }
  return { ratePerMin: originalPrice, originalPrice: null };
}

export async function getFreeCallDurationMins(): Promise<number> {
  const configMap = await getCachedAppSettings();
  const value = configMap['free_call_duration_mins'];
  if (!value || isNaN(Number(value))) {
    return 5; // Default to 5 minutes
  }
  return Number(value);
}

export async function isFreeCallEnabled(): Promise<boolean> {
  const configMap = await getCachedAppSettings();
  const value = configMap['free_call_enabled'];
  if (value === undefined) return true; // Default to true if not set
  return value !== 'false';
}
