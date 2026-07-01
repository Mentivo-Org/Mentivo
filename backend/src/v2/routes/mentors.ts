import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticateUser } from '../auth/authenticateUser.ts';
import { getAvailableMentors, setAvailable, setOffline } from '../services/presence.ts';
import prisma from '../config/db.ts';

const router = Router();

export const mentorInclude = {
  user: {
    select: {
      name: true,
      email: true,
      photo_url: true,
      _count: {
        select: {
          callSessionsMentor: {
            where: { status: { in: ['completed', 'settled'] } }
          }
        }
      }
    }
  }
};

export const formatMentor = (m: any, configMap: any = {}) => {
  const level = m.mentorlevel;
  let rate_per_min = Number(m.rate_per_min || 10);
  let originalPrice: number | null = null;

  if (level) {
    const levelPriceKey = `price_${level}`;
    const levelDiscountKey = `discount_${level}`;

    const originalPriceStr = configMap[levelPriceKey];
    const discountPriceStr = configMap[levelDiscountKey];

    const resolvedOriginalPrice = originalPriceStr && !isNaN(Number(originalPriceStr)) ? Number(originalPriceStr) : Number(m.rate_per_min || 10);
    const discountPrice = discountPriceStr && !isNaN(Number(discountPriceStr)) && discountPriceStr.trim() !== '' ? Number(discountPriceStr) : null;

    if (discountPrice !== null) {
      rate_per_min = discountPrice;
      originalPrice = resolvedOriginalPrice;
    } else {
      rate_per_min = resolvedOriginalPrice;
    }
  }

  return {
    ...m,
    rate_per_min,
    originalPrice,
    total_calls: m.user?._count?.callSessionsMentor || 0
  };
};

export const formatMentorList = async (mentorsList: any[]) => {
  const settings = await prisma.appSetting.findMany();
  const configMap = settings.reduce((acc: any, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  return mentorsList.map(m => formatMentor(m, configMap));
};

// GET /api/mentors/top
router.get('/top', async (req: Request, res: Response) => {
  try {
    const redis = (await import('../config/redis.ts')).default;
    const cached = await redis.get('public:top_mentors');
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    // Cache miss, trigger recalculation
    const { recalculateTopMentors } = await import('../services/topMentors.ts');
    const mentors = await recalculateTopMentors();
    res.json(mentors);
  } catch (err) {
    console.error('[GET /top] Error fetching top mentors:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

import { getCachedData, setCachedData } from '../utils/cache.ts';

// GET /api/mentors
router.get('/', authenticateUser, async (req:Request, res:Response) => {
  try {
    const availableIds = await getAvailableMentors();
    if (availableIds.length === 0) {
      return res.json([]);
    }

    // Try to get formatted mentors from cache
    const finalMentors = [];
    const cacheMisses = [];

    for (const id of availableIds) {
      const cached = await getCachedData<any>(`mentor:formatted:${id}`);
      if (cached) {
        finalMentors.push(cached);
      } else {
        cacheMisses.push(id);
      }
    }

    if (cacheMisses.length > 0) {
      const dbMentors = await prisma.mentorProfile.findMany({
        where: { mentorId: { in: cacheMisses } },
        include: mentorInclude
      });
      
      const formattedMisses = await formatMentorList(dbMentors);
      
      for (const m of formattedMisses) {
        await setCachedData(`mentor:formatted:${m.mentorId}`, m, 300); // 5 min TTL
        finalMentors.push(m);
      }
    }

    res.json(finalMentors);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/mentors/count/online
router.get('/count/online', authenticateUser, async (req: Request, res: Response) => {
  try {
    const availableIds = await getAvailableMentors();
    res.json({ count: availableIds.length });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/mentors/paginated
router.get('/paginated', authenticateUser, async (req: Request, res: Response) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    const onlineOnly = req.query.onlineOnly === 'true';
    const sortBy = (req.query.sortBy as string) || 'rating';
    const level = req.query.level as string;
    const language = req.query.language as string;

    let whereClause: any = {};
    
    if (onlineOnly) {
      const availableIds = await getAvailableMentors();
      whereClause.mentorId = { in: availableIds };
    }

    if (level && level !== 'All' && level !== 'Online') {
      whereClause.mentorlevel = level;
    }

    if (language && language.trim() !== '') {
      whereClause.languages = {
        contains: language.trim(),
        mode: 'insensitive',
      };
    }

    let orderBy: any = { avg_rating: 'desc' };
    if (sortBy === 'calls') {
      orderBy = { total_calls: 'desc' };
    }

    const mentors = await prisma.mentorProfile.findMany({
      where: whereClause,
      include: mentorInclude,
      orderBy: orderBy,
      skip: offset,
      take: limit,
    });
    
    res.json(await formatMentorList(mentors));
  } catch (err) {
    console.error('Error fetching paginated mentors:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//GET /api/mentors/online/paginated
router.get('/online/paginated', authenticateUser, async (req: Request, res: Response) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'rating';

    const availableIds = await getAvailableMentors();

    let orderBy: any = { avg_rating: 'desc' };
    if (sortBy === 'calls') {
      orderBy = { total_calls: 'desc' };
    }

    const mentors = await prisma.mentorProfile.findMany({
      where: { 
        mentorId: { in: availableIds },
      },
      include: mentorInclude,
      orderBy: orderBy,
      skip: offset,
      take: limit,
    });
    
    res.json(await formatMentorList(mentors));
  } catch (err) {
    console.error('Error fetching paginated mentors:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/mentors/promotion-conditions
router.get('/promotion-conditions', authenticateUser, async (req: Request, res: Response) => {
  try {
    const conditions = await prisma.mentorPromotionCondition.findMany({
      orderBy: { level: 'asc' }
    });
    res.json(conditions);
  } catch (err) {
    console.error('Error fetching promotion conditions:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/mentors/search
router.get('/search', authenticateUser, async (req: Request, res: Response) => {
  try {
    const iitName = req.query.iitName as string;
    
    if (!iitName) {
      return res.json([]);
    }

    const mentors = await prisma.mentorProfile.findMany({
      where: {
        iit_name: {
          contains: iitName,
          mode: 'insensitive',
        }
      },
      include: mentorInclude,
      orderBy: {
        avg_rating: 'desc'
      }
    });
    
    res.json(await formatMentorList(mentors));
  } catch (err) {
    console.error('Error searching mentors:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/mentors/favorites
router.get('/favorites', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const role = req.user?.role;

    if (role === 'mentor') {
      const students = await prisma.user.findMany({
        where: {
          role: 'student',
          favouriteMentors: {
            has: userId
          }
        },
        select: {
          id: true,
          name: true,
          photo_url: true,
          grade: true
        }
      });
      return res.json(students);
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { favouriteMentors: true }
      });

      if (!user || !user.favouriteMentors || user.favouriteMentors.length === 0) {
        return res.json([]);
      }

      const mentors = await prisma.mentorProfile.findMany({
        where: { mentorId: { in: user.favouriteMentors } },
        include: mentorInclude
      });

      return res.json(await formatMentorList(mentors));
    }
  } catch (err) {
    console.error('Error fetching favorite mentors/students:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/mentors/:id/favorite
router.post('/:id/favorite', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const mentorId = req.params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { favouriteMentors: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let updatedFavorites = [...(user.favouriteMentors || [])];
    const index = updatedFavorites.indexOf(mentorId as string);

    if (index === -1) {
      // Add to favorites
      updatedFavorites.push(mentorId as string);
    } else {
      // Remove from favorites
      updatedFavorites.splice(index, 1);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { favouriteMentors: updatedFavorites }
    });

    res.json({ success: true, favouriteMentors: updatedFavorites });
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/mentors/:id
router.get('/:id', authenticateUser, async (req:Request, res:Response) => {
  try {
    const mentor = await prisma.mentorProfile.findUnique({
      where: { mentorId: req.params.id as string },
      include: mentorInclude
    });
    
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }
    
    const availableIds = await getAvailableMentors();
    const formatted = await formatMentorList([mentor]);
    res.json({
      ...formatted[0],
      isOnline: availableIds.includes(req.params.id as string)
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/mentors/me/stats
router.get('/me/stats', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    if (req.user?.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const mentor = await prisma.mentorProfile.findUnique({
      where: { mentorId: userId },
      include: { user: true }
    });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor profile not found' });
    }

    const conditions = await prisma.mentorPromotionCondition.findMany();
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Fix startOfWeek calculation
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [todayCalls, weekCalls, allTimeCalls] = await Promise.all([
        prisma.callSession.aggregate({
            where: { mentor_id: userId, status: { in:['completed', 'settled'] }, endedAt: { gte: startOfToday } },
            _count: true,
            _sum: { mentorEarning: true }
        }),
        prisma.callSession.aggregate({
            where: { mentor_id: userId, status: { in:['completed', 'settled'] }, endedAt: { gte: startOfWeek } },
            _count: true,
            _sum: { mentorEarning: true }
        }),
        prisma.callSession.aggregate({
            where: { mentor_id: userId, status: { in:['completed', 'settled'] } },
            _count: true,
            _sum: { mentorEarning: true }
        })
    ]);

    const responseData = {
      profile: mentor,
      conditions,
      stats: {
          today: { count: todayCalls._count, earnings: todayCalls._sum.mentorEarning || 0 },
          week: { count: weekCalls._count, earnings: weekCalls._sum.mentorEarning || 0 },
          allTime: { count: allTimeCalls._count, earnings: allTimeCalls._sum.mentorEarning || 0 }
      }
    };

    // Ensure profile.total_calls reflects the actual all-time count for consistency
    if (responseData.profile) {
      responseData.profile.total_calls = responseData.stats.allTime.count;
    }

    res.json(responseData);
  } catch (err) {
    console.error('Error fetching mentor stats:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/mentors/me/status
router.post('/me/status', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { isOnline } = req.body;

    if (req.user?.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (isOnline) {
      await setAvailable(userId);
    } else {
      await setOffline(userId);
    }

    res.json({ success: true, isOnline });
  } catch (err) {
    console.error('Error updating mentor status:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/mentors/me/profile
router.patch('/me/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { upiId, expertise, bio, year } = req.body;

    if (req.user?.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (year !== undefined && year !== null && year !== '') {
      if (isNaN(Number(year))) {
        return res.status(400).json({ error: 'Year must be a valid number' });
      }
    }

    const updatedProfile = await prisma.mentorProfile.update({
      where: { mentorId: userId },
      data: {
        upiId: upiId !== undefined ? upiId : undefined,
        expertise: expertise !== undefined ? expertise : undefined,
        bio: bio !== undefined ? bio : undefined,
        year: year !== undefined ? (year !== null && year !== '' ? parseInt(year) : null) : undefined
      }
    });

    res.json({ success: true, profile: updatedProfile });
  } catch (err) {
    console.error('Error updating mentor profile:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/mentors/me/reapply
router.post('/me/reapply', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    if (req.user?.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { profile_completed: false }
    });

    res.json({ success: true, message: 'Ready to re-enter details.' });
  } catch (err) {
    console.error('Error in reapply:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
