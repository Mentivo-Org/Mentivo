import prisma from '../config/db.ts';

const MENTOR_SHARE = 0.70; // 70%

export async function settleBilling(sessionId: string, durationSecs: number, recordingUrl?: string) {
  // Use a transaction
  await prisma.$transaction(async (tx) => {
    // 1. ATOMIC LOCK: Attempt to update the status to a temporary state 'settling'
    // This prevents race conditions where two processes read 'active' at the same time.
    const lock = await tx.callSession.updateMany({
      where: { 
        id: sessionId, 
        status: { in: ['active', 'completed', 'ringing', 'calling'] } 
      },
      data: { status: 'settling' }
    });

    if (lock.count === 0) {
      // Either not found or already settled/in-process by another request
      return; 
    }

    // Now that we have the lock, fetch the session details with all required relations
    const session = await tx.callSession.findUnique({
      where: { id: sessionId },
      include: {
        mentor: {
          include: {
            mentorProfile: true
          }
        },
        student: {
          include: {
            wallet: true
          }
        }
      }
    });

    if (!session) return;

    // 2. Calculation
    const { getMentorActiveRateByProfile, getFreeCallDurationMins } = await import('../utils/pricing.ts');
    const { ratePerMin } = await getMentorActiveRateByProfile(session.mentor?.mentorProfile);
    const isFree = session.is_free; 
    const freeMins = await getFreeCallDurationMins();
    const freeSeconds = freeMins * 60;
    const billableSecs = isFree ? Math.max(0, durationSecs - freeSeconds) : durationSecs;
    const billableMins = Math.ceil(billableSecs / 60);
    const totalCharge = billableMins * ratePerMin;
    const mentorEarning = totalCharge * MENTOR_SHARE;
    const platformFee = totalCharge - mentorEarning;

    if (totalCharge > 0) {
      // 3. Debit student wallet.
      const studentWallet = session.student.wallet;
      const amountToCharge = studentWallet && Number(studentWallet.balance) >= totalCharge 
        ? totalCharge 
        : Number(studentWallet?.balance || 0);

      const actualMentorEarning = amountToCharge * MENTOR_SHARE;
      const actualPlatformFee = amountToCharge - actualMentorEarning;

      // Deduct from wallet
      await tx.wallet.update({
        where: { userId: session.student_id },
        data: { balance: { decrement: amountToCharge } }
      });

      // Credit mentor
      await tx.mentorBalance.upsert({
        where: { mentorId: session.mentor_id },
        create: {
          mentorId: session.mentor_id,
          pendingPayout: actualMentorEarning,
          totalEarned: actualMentorEarning
        },
        update: {
          pendingPayout: { increment: actualMentorEarning },
          totalEarned: { increment: actualMentorEarning }
        }
      });

      // Update mentor profile stats
      await tx.mentorProfile.update({
        where: { mentorId: session.mentor_id },
        data: { total_calls: { increment: 1 } }
      });

      // 4. Handle 5% revenue share for CoachingCenterBalance if applicable
      const coachingCenterId = session.student.coachingCenterId;
      if (coachingCenterId) {
        const centerShare = amountToCharge * 0.05; // 5%
        await tx.coachingCenterBalance.upsert({
          where: { centerId: coachingCenterId },
          create: {
            centerId: coachingCenterId,
            pendingPayout: centerShare,
            totalEarned: centerShare
          },
          update: {
            pendingPayout: { increment: centerShare },
            totalEarned: { increment: centerShare }
          }
        });
      }

      // Finalize the session record
      await tx.callSession.update({
        where: { id: sessionId },
        data: {
          status: 'settled',
          durationSecs,
          amountCharged: amountToCharge,
          mentorEarning: actualMentorEarning,
          platformFee: actualPlatformFee,
          ratePerMin,
          recordingUrl,
          settledAt: new Date()
        }
      });

    } else {
      // Free call
      await tx.callSession.update({
        where: { id: sessionId },
        data: {
          status: 'settled',
          durationSecs,
          amountCharged: 0,
          mentorEarning: 0,
          platformFee: 0,
          ratePerMin,
          recordingUrl,
          settledAt: new Date()
        }
      });
    }
  });
}
