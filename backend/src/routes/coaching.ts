import type { Request, Response } from 'express';
import { Router } from 'express';
import prisma from '../config/db.ts';
import { generateCoachingCode } from '../utils/codeGenerator.ts';

const router = Router();

/**
 * POST /api/coaching/login
 * Login for coaching centers using their unique code.
 */
router.post('/login', async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Coaching code is required' });
  }

  try {
    const center = await prisma.coachingCenter.findUnique({
      where: { code },
      include: {
        balance: true
      }
    });

    if (!center) {
      return res.status(401).json({ error: 'Invalid coaching code' });
    }

    // In a real app, we'd issue a JWT here. 
    // For now, we'll return the center details as a "login" success.
    res.json({
      message: 'Login successful',
      center: {
        id: center.id,
        name: center.name,
        code: center.code,
        balance: center.balance
      }
    });
  } catch (error) {
    console.error('Coaching login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/coaching/dashboard/:id
 * Get aggregated data for a coaching center's students.
 */
router.get('/dashboard/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const students = await prisma.user.findMany({
      where: { coachingCenterId: id },
      include: {
        callSessionsStudent: {
          where: { status: 'settled' }
        }
      }
    });

    const totalStudents = students.length;
    let totalRevenueGenerated = 0;
    let totalCalls = 0;
    let totalDurationSecs = 0;

    students.forEach(student => {
      student.callSessionsStudent.forEach(session => {
        totalRevenueGenerated += Number(session.amountCharged);
        totalCalls++;
        totalDurationSecs += session.durationSecs;
      });
    });

    const coachingCommission = totalRevenueGenerated * 0.05;

    res.json({
      totalStudents,
      totalCalls,
      totalDurationSecs,
      totalRevenueGenerated,
      coachingCommission,
      students: students.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        callsCount: s.callSessionsStudent.length,
        revenueGenerated: s.callSessionsStudent.reduce((acc, curr) => acc + Number(curr.amountCharged), 0)
      }))
    });
  } catch (error) {
    console.error('Coaching dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/coaching/create
 * Admin endpoint to create a new coaching center.
 */
router.post('/create', async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const code = generateCoachingCode();
    const center = await prisma.coachingCenter.create({
      data: {
        name,
        code,
        balance: {
          create: {}
        }
      }
    });

    res.status(201).json(center);
  } catch (error) {
    console.error('Create coaching center error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
