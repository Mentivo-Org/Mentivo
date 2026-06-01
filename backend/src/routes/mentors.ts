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
