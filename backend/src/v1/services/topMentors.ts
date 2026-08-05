import prisma from '../config/db.ts';
import redis from '../config/redis.ts';
import { mentorInclude, formatMentorList } from '../routes/mentors.ts';

export const recalculateTopMentors = async () => {
    try {
        console.log('[TopMentors v1] Recalculating top mentors cache...');
        
        const settings = await prisma.appSetting.findMany({
            where: {
                key: {
                    in: ['top_mentors_min_rating', 'top_mentors_min_calls', 'top_mentors_limit']
                }
            }
        });

        const configMap = settings.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        const minRating = parseFloat(configMap['top_mentors_min_rating'] || '4.5');
        const minCalls = parseInt(configMap['top_mentors_min_calls'] || '10', 10);
        const limit = parseInt(configMap['top_mentors_limit'] || '5', 10);

        const mentors = await prisma.mentorProfile.findMany({
            where: {
                verificationStatus: 'VERIFIED',
                avg_rating: { gte: minRating },
                total_calls: { gte: minCalls }
            },
            include: mentorInclude,
            orderBy: [
                { avg_rating: 'desc' },
                { total_calls: 'desc' }
            ],
            take: limit
        });

        const formatted = await formatMentorList(mentors);
        
        // Cache the formatted result in Redis as a JSON string
        await redis.set('public:top_mentors', JSON.stringify(formatted));
        
        console.log(`[TopMentors v1] Successfully recalculated and cached ${formatted.length} top mentors.`);
        return formatted;
    } catch (err) {
        console.error('[TopMentors v1] Error recalculating top mentors:', err);
        throw err;
    }
};
