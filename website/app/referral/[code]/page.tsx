import { redirect } from 'next/navigation';

export default async function ReferralPage({ params }: { params: Promise<{ code: string }> | { code: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const referralCode = `MENTIVO-${resolvedParams.code}`;
  
  // Play Store URL with referrer parameter
  const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=com.mentivo.in&referrer=${referralCode}`;
  
  // Redirect directly to the play store
  redirect(PLAY_STORE_URL);
}
