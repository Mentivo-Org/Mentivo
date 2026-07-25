import prisma from '../config/db.ts';

export async function syncPartnerStats(targetPartnerId?: string) {
  let partnersProcessed = 0;
  let totalEarnedSynced = 0;
  const errors: any[] = [];

  try {
    const whereClause = targetPartnerId ? { id: targetPartnerId } : {
      role: { in: ['coaching_partner', 'telegram_partner', 'other_partner'] }
    };

    const partners = await prisma.user.findMany({
      where: whereClause,
      include: {
        partnerBalance: true,
      }
    });

    for (const partner of partners) {
      try {
        let computedTotalEarned = 0;

        // 1. Calculate signup bonuses (per_signup)
        if (partner.commissionMethod === 'per_signup' && partner.commissionValue) {
          // Count users who signed up using this partner's referral code
          const referredUsersCount = await prisma.user.count({
            where: { referredByReferralCode: partner.referralCode }
          });
          computedTotalEarned += referredUsersCount * Number(partner.commissionValue);
        }

        // 2. Calculate revenue share (percent_revenue)
        if (partner.commissionMethod === 'percent_revenue' && partner.commissionValue) {
           // Find all students referred by this partner
           const referredStudents = await prisma.user.findMany({
             where: { referredByReferralCode: partner.referralCode },
             select: { id: true }
           });
           
           const studentIds = referredStudents.map(s => s.id);

           if (studentIds.length > 0) {
             // Sum the amountCharged for all settled calls of these students
             const aggregateResult = await prisma.callSession.aggregate({
               _sum: {
                 amountCharged: true
               },
               where: {
                 student_id: { in: studentIds },
                 status: 'settled'
               }
             });

             const totalAmountCharged = aggregateResult._sum.amountCharged || 0;
             const commissionRate = Number(partner.commissionValue) / 100;
             computedTotalEarned += Number(totalAmountCharged) * commissionRate;
           }
        }

        // 3. Sync to PartnerBalance
        const currentBalance = partner.partnerBalance;
        
        // Only TotalEarned can be recomputed. Pending payout = Total Earned - Total Withdrawn.
        const totalWithdrawn = currentBalance ? Number(currentBalance.totalWithdrawn) : 0;
        const pendingPayout = Math.max(0, computedTotalEarned - totalWithdrawn); // Should not be negative

        await prisma.partnerBalance.upsert({
          where: { partnerId: partner.id },
          create: {
            partnerId: partner.id,
            totalEarned: computedTotalEarned,
            pendingPayout: pendingPayout,
            totalWithdrawn: 0
          },
          update: {
            totalEarned: computedTotalEarned,
            pendingPayout: pendingPayout
          }
        });

        partnersProcessed++;
        totalEarnedSynced += computedTotalEarned;

      } catch (e: any) {
        errors.push({ partnerId: partner.id, error: e.message });
      }
    }

    return { partnersProcessed, totalEarnedSynced, errors };
  } catch (error: any) {
    console.error("Failed to sync partner stats:", error);
    throw error;
  }
}
