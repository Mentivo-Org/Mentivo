import cron from 'node-cron';
import prisma from '../config/db.ts';
import { settleBilling } from '../services/billing.ts';
import { setAvailable } from '../services/presence.ts';
import { startPromotionJob } from './promotionJob.ts';

/**
 * Abandoned Call Sweeper
 * Runs every minute to find call sessions that timed out (heartbeat missing)
*/
async function sweepAbandonedCalls() {
    try {
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

        if (abandonedCalls.length === 0) return;

        console.log(`[Sweeper] Found ${abandonedCalls.length} abandoned calls.`);

        for (const call of abandonedCalls) {
            try {
                // End the call at the last heartbeat timestamp
                const endedAt = call.lastHeartbeatAt || call.startedAt || new Date();
                const durationSecs = call.startedAt ? Math.floor((endedAt.getTime() - call.startedAt.getTime()) / 1000) : 0;

                await prisma.callSession.update({
                    where: { id: call.id },
                    data: { endedAt, status: 'completed' } // Ensure status is updated
                });

                // Make mentor available again
                await setAvailable(call.mentor_id);

                // Settle billing
                await settleBilling(call.id, durationSecs);
                console.log(`[Sweeper] Successfully swept call ${call.id}`);
            } catch (e) {
                console.error(`[Sweeper] Failed to sweep call ${call.id}:`, e);
            }
        }
    } catch (err) {
        console.error('[Sweeper] Error in abandoned call sweeper:', err);
    }
}

/**
 * Weekly Payouts
 * Processes pending balances for mentors every Monday
 */
async function processWeeklyPayouts() {
    try {
        console.log('[Payouts] Starting weekly payout process...');
        
        // Find mentors with a pending payout >= 100
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
                            status: useRazorpayX ? 'processing' : 'manual_pending'
                        }
                    });
                });

                if (useRazorpayX) {
                    console.log(`[Payouts] Razorpay X payout triggered for ${balance.mentorId}`);
                } else {
                    console.log(`[Payouts] [MANUAL PAYOUT REQUIRED] Amount: ₹${balance.pendingPayout} | Mentor: ${balance.mentorId} | UPI: ${profile?.upiId || 'NOT PROVIDED'}`);
                }
            } catch (e) {
                console.error(`[Payouts] Failed to process payout for ${balance.mentorId}:`, e);
            }
        }
        console.log('[Payouts] Weekly payout process completed.');
    } catch (err) {
        console.error('[Payouts] Error in weekly payout job:', err);
    }
}

// Schedule repeatable jobs
export function startJobs() {
    console.log('Initializing background jobs with node-cron (Redis-free scheduler)...');

    // 1. Run sweeper every 1 minute
    cron.schedule('* * * * *', () => {
        sweepAbandonedCalls().catch(err => console.error('Unhandled Sweeper error:', err));
    });

    // 2. Run payouts every Monday at 3 AM
    cron.schedule('0 3 * * 1', () => {
        processWeeklyPayouts().catch(err => console.error('Unhandled Payouts error:', err));
    });

    // 3. Run mentor promotion job
    startPromotionJob();

    // No need to return a promise that resolves after adding jobs since they are in-memory
    return Promise.resolve();
}
