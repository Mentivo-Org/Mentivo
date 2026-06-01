import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticateUser } from '../auth/authenticateUser.ts';
import { getAvailableMentors, setAvailable } from '../services/presence.ts';
import prisma from '../config/db.ts';

const router = Router();

// GET /api/mentors
router.get('/', authenticateUser, async (req:Request, res:Response) => {
  try {
    const availableIds = await getAvailableMentors();
    if (availableIds.length === 0) {
      return res.json([]);
    }

    const mentors = await prisma.mentorProfile.findMany({
      where: { mentorId: { in: availableIds } },
      include: { user: { select: { name: true, email: true } } }
    });
    
    res.json(mentors);
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

    let whereClause: any = {};
    
    if (onlineOnly) {
      const availableIds = await getAvailableMentors();
      whereClause.mentorId = { in: availableIds };
    }

    const mentors = await prisma.mentorProfile.findMany({
      where: whereClause,
      include: { 
        user: { select: { name: true, email: true } } 
      },
      orderBy: {
        avg_rating: 'desc'
      },
      skip: offset,
      take: limit,
    });
    
    res.json(mentors);
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

    const availableIds = await getAvailableMentors();

    const mentors = await prisma.mentorProfile.findMany({
      where: { 
        mentorId: { in: availableIds },
      },
      include: { 
        user: { select: { name: true, email: true } } 
      },
      orderBy: {
        avg_rating: 'desc'
      },
      skip: offset,
      take: limit,
    });
    
    res.json(mentors);
  } catch (err) {
    console.error('Error fetching paginated mentors:', err);
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
      include: { 
        user: { select: { name: true, email: true } } 
      },
      orderBy: {
        avg_rating: 'desc'
      }
    });
    
    res.json(mentors);
  } catch (err) {
    console.error('Error searching mentors:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/mentors/favorites
router.get('/favorites', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { favouriteMentors: true }
    });

    if (!user || !user.favouriteMentors || user.favouriteMentors.length === 0) {
      return res.json([]);
    }

    const mentors = await prisma.mentorProfile.findMany({
      where: { mentorId: { in: user.favouriteMentors } },
      include: { user: { select: { name: true, email: true } } }
    });

    res.json(mentors);
  } catch (err) {
    console.error('Error fetching favorite mentors:', err);
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
    const index = updatedFavorites.indexOf(mentorId);

    if (index === -1) {
      // Add to favorites
      updatedFavorites.push(mentorId);
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
      include: { user: { select: { name: true, email: true } } }
    });
    
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }
    
    res.json(mentor);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/mentors/me/heartbeat
router.patch('/me/heartbeat', authenticateUser, async (req: Request, res:Response) => {
  try {
    const userId = req.user?.id as string;
    // Verify the user is a mentor
    if(req.user?.role!=='mentor') {
      return res.status(400).json({
        error: "You are not allowed to request at this endpoint"
      })
    }
    await setAvailable(userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
