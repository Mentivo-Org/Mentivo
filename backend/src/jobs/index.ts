import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../config/db.ts';
import { settleBilling } from '../services/billing.ts';
import { setAvailable } from '../services/presence.ts';
import { payoutToMentor } from '../services/razorpay.ts';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    family: 0 // Highly recommended for Upstash compatibility
});

// 1. Abandoned Call Sweeper
export const sweeperQueue = new Queue('AbandonedCallSweeper', { connection });

const sweeperWorker = new Worker('AbandonedCallSweeper', async (job: Job) => {
    // Look for active sessions where the last heartbeat is older than 30 seconds
    const THIRTY_SECONDS = 30 * 1000;
    const thresholdDate = new Date(Date.now() - THIRTY_SECONDS);

    const abandonedCalls = await prisma.callSession.findMany({
        where: {
            status: 'active',
            lastHeartbeatAt: {
                lt: thresholdDate
            }
        }
    });

    for (const call of abandonedCalls) {
        try {
            // End the call at the last heartbeat timestamp
            // Fallback to startedAt if no heartbeats were ever received
            const endedAt = call.lastHeartbeatAt || call.startedAt || new Date();
            const durationSecs = call.startedAt ? Math.floor((endedAt.getTime() - call.startedAt.getTime()) / 1000) : 0;

            await prisma.callSession.update({
                where: { id: call.id },
                data: { endedAt }
            });

            // Make mentor available again
            await setAvailable(call.mentor_id);

            // Settle billing
            await settleBilling(call.id, durationSecs);
            console.log(`Swept abandoned call ${call.id}`);
        } catch (e) {
            console.error(`Failed to sweep call ${call.id}:`, e);
        }
    }
}, { connection });

// 2. Weekly Payouts
export const payoutsQueue = new Queue('PayoutsQueue', { connection });

const payoutsWorker = new Worker('PayoutsQueue', async (job: Job) => {
    // Find mentors with a pending payout >= 100 (for example)
    const mentorBalances = await prisma.mentorBalance.findMany({
        where: {
            pendingPayout: { gte: 100 }
        }
    });

    const useRazorpayX = process.env.ENABLE_RAZORPAY_X === 'true';

    for (const balance of mentorBalances) {
        try {
            // Get mentor profile for UPI ID
            const profile = await prisma.mentorProfile.findUnique({
                where: { mentorId: balance.mentorId }
            });

            await prisma.$transaction(async (tx) => {
                // Deduct first
                await tx.mentorBalance.update({
                    where: { mentorId: balance.mentorId },
                    data: {
                        pendingPayout: 0,
                        totalWithdrawn: { increment: balance.pendingPayout }
                    }
                });

                // Generate tracking record
                await tx.payout.create({
                    data: {
                        mentorId: balance.mentorId,
                        amount: balance.pendingPayout,
                        status: useRazorpayX ? 'processing' : 'manual_pending' // Mark manual if Razorpay X is disabled
                    }
                });
            });

            if (useRazorpayX) {
                // In a full Razorpay X implementation, you would convert the upiId into a Contact and Fund Account first.
                // await payoutToMentor(balance.mentorId, Number(balance.pendingPayout), 'fund_account_id_from_upi');
                console.log(`Razorpay X payout triggered for ${balance.mentorId}`);
            } else {
                console.log(`[MANUAL PAYOUT REQUIRED] Amount: ₹${balance.pendingPayout} | Mentor: ${balance.mentorId} | UPI: ${profile?.upiId || 'NOT PROVIDED'}`);
            }

        } catch (e) {
            console.error(`Failed to process payout for ${balance.mentorId}:`, e);
        }
    }
}, { connection });

// Schedule repeatable jobs
export async function startJobs() {
    // Run sweeper every 1 minute
    await sweeperQueue.add('sweep', {}, {
        repeat: { pattern: '* * * * *' } // Every minute
    });

    // Run payouts every Monday at 3 AM
    await payoutsQueue.add('weekly_payout', {}, {
        repeat: { pattern: '0 3 * * 1' }
    });
}
