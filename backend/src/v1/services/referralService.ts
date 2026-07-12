import prisma from "../config/db.ts";

/**
 * Processes the referral bonus for a newly completed user profile.
 * Should be called when a user completes their profile.
 * 
 * @param newUserId The ID of the newly registered user
 * @param referredByReferralCode The referral code they used to sign up
 */
export async function processReferralBonus(newUserId: string, referredByReferralCode: string): Promise<void> {
  try {
    // 1. Find the partner who owns this referral code
    const partner = await prisma.user.findUnique({
      where: { referralCode: referredByReferralCode }
    });

    if (!partner) {
      console.warn(`Referral Code ${referredByReferralCode} not found for new user ${newUserId}`);
      return;
    }

    // 2. Only process at signup if commissionMethod is 'per_signup'
    // (If percent_revenue, it's handled later during settleBilling)
    if (partner.commissionMethod !== 'per_signup') {
      return;
    }

    // Check if bonus already applied to prevent duplicate credits
    const existingTransaction = await prisma.walletTransaction.findFirst({
      where: {
        userId: newUserId,
        type: 'referral_signup_bonus'
      }
    });

    if (existingTransaction) {
      console.log(`Referral bonus already applied for user ${newUserId}`);
      return;
    }

    const commissionValue = partner.commissionValue || 0;
    const studentBonusValue = partner.studentBonusValue || 0;

    await prisma.$transaction(async (tx) => {
      // 3. Upsert PartnerBalance to credit the referrer
      if (Number(commissionValue) > 0) {
        await tx.partnerBalance.upsert({
          where: { partnerId: partner.id },
          create: {
            partnerId: partner.id,
            pendingPayout: commissionValue,
            totalEarned: commissionValue,
            totalWithdrawn: 0
          },
          update: {
            pendingPayout: { increment: commissionValue },
            totalEarned: { increment: commissionValue }
          }
        });
      }

      // 4. Credit the new student's Wallet
      if (Number(studentBonusValue) > 0) {
        await tx.wallet.upsert({
          where: { userId: newUserId },
          create: {
            userId: newUserId,
            balance: studentBonusValue
          },
          update: {
            balance: { increment: studentBonusValue }
          }
        });

        // 5. Log WalletTransaction for the student
        await tx.walletTransaction.create({
          data: {
            userId: newUserId,
            amount: studentBonusValue,
            type: 'referral_signup_bonus',
            status: 'completed'
          }
        });
      }
    });

    console.log(`Successfully processed referral bonus for user ${newUserId} (Referrer: ${partner.id})`);

  } catch (error) {
    console.error("Error processing referral bonus:", error);
    // We throw so the calling controller can catch it, but we won't fail the overall profile update request
    throw error;
  }
}
