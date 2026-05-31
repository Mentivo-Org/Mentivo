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
    // Assuming the user is a mentor
    await setAvailable(userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
