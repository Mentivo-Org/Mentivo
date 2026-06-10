import cron from 'node-cron';
import prisma from '../config/db.ts';
import { sendMentorPromotionAlert } from '../services/notifications.ts';

export const startPromotionJob = () => {
  // Run every night at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('Running nightly mentor promotion job...');
    await checkAndPromoteMentors();
  });
};

export const checkAndPromoteMentors = async () => {
  try {
    const conditions = await prisma.mentorPromotionCondition.findMany();
    const standardCond = conditions.find(c => c.level === 'Standard');
    const signatureCond = conditions.find(c => c.level === 'Signature');

    if (!standardCond && !signatureCond) {
      console.log('No promotion conditions set. Skipping.');
      return;
    }

    // Only fetch mentors who can be auto-promoted
    const mentors = await prisma.mentorProfile.findMany({
      where: {
        mentorlevel: { in: ['Verified', 'Standard'] }
      },
      include: {
        user: {
          include: {
            fcmTokens: true,
            _count: {
              select: {
                callSessionsMentor: {
                  where: { status: { in: ['completed', 'settled'] } }
                }
              }
            }
          }
        }
      }
    });

    for (const mentor of mentors) {
      let finalLevel: 'Standard' | 'Signature' | null = null;
      const actualTotalCalls = (mentor.user as any)._count?.callSessionsMentor || 0;

      // Check for Signature first if they are Standard or if they might jump from Verified to Signature
      if (signatureCond && actualTotalCalls >= signatureCond.minCalls && Number(mentor.avg_rating) >= Number(signatureCond.minRating)) {
        if (mentor.mentorlevel !== 'Signature') {
          finalLevel = 'Signature';
        }
      } 
      // Else check for Standard if they are Verified
      else if (mentor.mentorlevel === 'Verified' && standardCond && actualTotalCalls >= standardCond.minCalls && Number(mentor.avg_rating) >= Number(standardCond.minRating)) {
        finalLevel = 'Standard';
      }

      if (finalLevel) {
        await promoteMentor(mentor.mentorId, finalLevel, mentor.user.fcmTokens.map(t => t.token));
      }
    }
  } catch (error) {
    console.error('Error in promotion job:', error);
  }
};

const promoteMentor = async (mentorId: string, level: string, fcmTokens: string[]) => {
  console.log(`Promoting mentor ${mentorId} to ${level}`);
  
  await prisma.$transaction([
    prisma.mentorProfile.update({
      where: { mentorId },
      data: { mentorlevel: level as any }
    }),
    prisma.notification.create({
      data: {
        userId: mentorId,
        title: 'Level Up! 🚀',
        body: `Congratulations! You have been promoted to ${level} Mentor.`
      }
    })
  ]);

  for (const token of fcmTokens) {
    await sendMentorPromotionAlert(token, level);
  }
};
