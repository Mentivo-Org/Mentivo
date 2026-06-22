import prisma from '../config/db.ts';

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
  const settings = await prisma.appSetting.findMany();
  const configMap = settings.reduce((acc: any, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

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
  const setting = await prisma.appSetting.findUnique({
    where: { key: 'free_call_duration_mins' }
  });
  if (!setting || isNaN(Number(setting.value))) {
    return 5; // Default to 5 minutes
  }
  return Number(setting.value);
}
