import admin from '../config/firebase.ts';
import prisma from '../config/db.ts';
import redis from '../config/redis.ts';

export async function pingOnlineMentors() {
    try {
        console.log('[PingMentors] Starting routine ping to online mentors...');
        // Get all mentors who are currently marked as online
        const onlineMentors = await prisma.mentorProfile.findMany({
            where: { isOnline: true },
            select: { mentorId: true, user: { select: { fcmTokens: { select: { token: true } } } } }
        });

        if (onlineMentors.length === 0) {
            console.log('[PingMentors] No online mentors found to ping.');
            return;
        }

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const hour = now.getHours(); 
        const timeSlot = `${hour}h`; 

        for (const mentor of onlineMentors) {
            const tokens = mentor.user?.fcmTokens?.map(t => t.token) || [];
            
            // Mark pending in Redis
            const redisKey = `mentor:daily_ping:${dateStr}:${mentor.mentorId}`;
            await redis.hset(redisKey, timeSlot, 'pending');
            // Expire after 48 hours to clean up
            await redis.expire(redisKey, 48 * 3600);

            if (tokens.length > 0 && admin.apps.length) {
                try {
                    await admin.messaging().sendEachForMulticast({
                        tokens,
                        data: { type: 'ping' },
                        android: { priority: 'high' }
                    });
                    console.log(`[PingMentors] Sent ping to mentor ${mentor.mentorId}`);
                } catch (err) {
                    console.error(`[PingMentors] Failed to send FCM to mentor ${mentor.mentorId}:`, err);
                }
            }
        }
    } catch (error) {
        console.error('[PingMentors] Error in pingOnlineMentors:', error);
    }
}

export async function checkMentorPings() {
    try {
        console.log('[PingMentors] Checking previous day mentor pings...');
        const now = new Date();
        // Go back 1 day to check yesterday's pings
        now.setDate(now.getDate() - 1);
        const dateStr = now.toISOString().split('T')[0];

        // Find all mentor keys for yesterday
        const keys = await redis.keys(`mentor:daily_ping:${dateStr}:*`);

        for (const key of keys) {
            const mentorId = key.split(':').pop();
            if (!mentorId) continue;

            const pingData = await redis.hgetall(key);
            
            // If they didn't respond to ANY of the pings sent to them
            const hasResponded = Object.values(pingData).some(status => status === 'responded');

            if (!hasResponded) {
                // Check if they are still online before marking them offline
                const mentor = await prisma.mentorProfile.findUnique({
                    where: { mentorId },
                    include: { user: { include: { fcmTokens: true } } }
                });

                if (mentor && mentor.isOnline) {
                    console.log(`[PingMentors] Mentor ${mentorId} failed all pings. Marking offline.`);
                    await prisma.mentorProfile.update({
                        where: { mentorId },
                        data: { isOnline: false }
                    });

                    // Send FCM notification
                    const tokens = mentor.user?.fcmTokens?.map(t => t.token) || [];
                    if (tokens.length > 0 && admin.apps.length) {
                        try {
                            await admin.messaging().sendEachForMulticast({
                                tokens,
                                notification: {
                                    title: 'Profile marked offline',
                                    body: 'You missed your availability pings. Your profile has been marked offline.'
                                },
                                data: { type: 'marked_offline' },
                                android: { priority: 'high' }
                            });
                        } catch (err) {
                            console.error(`[PingMentors] Failed to send marked_offline FCM to mentor ${mentorId}:`, err);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('[PingMentors] Error in checkMentorPings:', error);
    }
}
