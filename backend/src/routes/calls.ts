import { Router } from 'express';
import { authenticateUser } from '../auth/authenticateUser.ts';
import { generateToken, generateChannelName } from '../services/agora.ts';
import { lockToBusy, getPresenceState, setAvailable } from '../services/presence.ts';
import { settleBilling } from '../services/billing.ts';
import prisma from '../config/db.ts';

const router = Router();

// POST /api/calls/initiate
router.post('/initiate', authenticateUser, async (req, res) => {
  const { mentorId } = req.body;
  const studentId = req.user?.id;

  try {
    // 1. Check Mentor Availability
    const mentorState = await getPresenceState(mentorId);
    if (mentorState !== 'available') {
      return res.status(400).json({ error: 'Mentor is currently offline or busy' });
    }

    // 2. Validate student wallet balance (min ₹10)
    const wallet = await prisma.wallet.findUnique({ where: { userId: studentId } });
    if (!wallet || Number(wallet.balance) < 50) {
      return res.status(402).json({ error: 'Insufficient wallet balance (Minimum ₹10)' });
    }

    // 3. Check if first call (free)
    const pastCalls = await prisma.callSession.count({ where: { student_id: studentId } });
    const isFree = pastCalls === 0;

    // 4. Lock Mentor
    await lockToBusy(mentorId);

    // 5. Create Session
    const channelName = generateChannelName(studentId as string, mentorId);
    if (!channelName) {
      return res.status(500).json({ error: 'Failed to generate channel ID' });
    }

    const session = await prisma.callSession.create({
      data: {
        student_id: studentId as string,
        mentor_id: mentorId as string,
        agoraChannelId: channelName,
        status: 'pending',
        is_free: isFree
      }
    });

    // 6. Calculate Max Affordable Duration (INR 10/min)
    const affordableMinutes = Math.floor(Number(wallet.balance) / 10);
    // Buffer for first free call (if applicable) or standard call
    // We add 300s (5min) if it is free, and set the token to expire 60s after their max money runs out
    const bufferSeconds = 60;
    const maxAllowedSeconds = (affordableMinutes * 60) + (isFree ? 300 : 0) + bufferSeconds;

    // 7. Generate Agora Tokens with Dynamic Expiry
    const studentToken = generateToken(channelName, studentId as string, maxAllowedSeconds);
    const mentorToken = generateToken(channelName, mentorId, 3600); // Mentor can stay 1hr

    res.json({
      sessionId: session.id,
      channelName,
      studentToken,
      mentorToken,
      isFree,
      maxDurationSeconds: maxAllowedSeconds
    });
  } catch (error) {
    console.error('Call initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

// POST /api/calls/schedule
router.post('/schedule', authenticateUser, async (req, res) => {
  const { mentorId, scheduledAt, durationMins } = req.body;
  const studentId = req.user?.id;

  try {
    if (!mentorId || !scheduledAt || !durationMins) {
      return res.status(400).json({ error: 'Missing required fields: mentorId, scheduledAt, durationMins' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduledAt format' });
    }

    if (scheduledDate < new Date()) {
      return res.status(400).json({ error: 'Cannot schedule calls in the past' });
    }

    // 1. Validate student wallet balance (min ₹10)
    const wallet = await prisma.wallet.findUnique({ where: { userId: studentId } });
    if (!wallet || Number(wallet.balance) < 10) {
      return res.status(402).json({ error: 'Insufficient wallet balance (Minimum ₹10 required to schedule)' });
    }

    // 2. Check if mentor exists
    const mentor = await prisma.user.findUnique({ 
      where: { id: mentorId, role: 'mentor' } 
    });
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // 2.5 Check for conflicts (30 mins buffer)
    const existingCalls = await prisma.callSession.findMany({
      where: {
        OR: [
          { mentor_id: mentorId },
          { student_id: studentId as string }
        ],
        status: 'scheduled',
        scheduledAt: { gte: new Date() }
      }
    });

    const newStart = scheduledDate.getTime();
    const newEnd = newStart + (durationMins * 60 * 1000);
    const newBufferEnd = newEnd + (30 * 60 * 1000);

    for (const call of existingCalls) {
      if (call.scheduledAt && call.scheduledDuration) {
        const existStart = call.scheduledAt.getTime();
        const existEnd = existStart + (call.scheduledDuration * 60 * 1000);
        const existBufferEnd = existEnd + (30 * 60 * 1000);

        // Check if new call (with its 30-min buffer) overlaps existing call (with its buffer)
        if (newStart < existBufferEnd && newBufferEnd > existStart) {
          const conflictType = call.mentor_id === mentorId ? 'mentor' : 'your';
          return res.status(409).json({ error: `Time slot conflicts with an existing call for ${conflictType} (requires 30-min gap).` });
        }
      }
    }

    // 3. Create Session with status 'scheduled'
    const channelName = generateChannelName(studentId as string, mentorId);
    if (!channelName) {
      return res.status(500).json({ error: 'Failed to generate channel ID' });
    }

    const session = await prisma.callSession.create({
      data: {
        student_id: studentId as string,
        mentor_id: mentorId as string,
        agoraChannelId: channelName as string,
        status: 'scheduled',
        scheduledAt: scheduledDate,
        scheduledDuration: parseInt(durationMins)
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      channelName,
      scheduledAt: session.scheduledAt,
      message: 'Call scheduled successfully'
    });
  } catch (error) {
    console.error('Call scheduling error:', error);
    res.status(500).json({ error: 'Failed to schedule call' });
  }
});

// GET /api/calls/mentor/:mentorId/schedule
router.get('/mentor/:mentorId/schedule', async (req, res) => {
  try {
    const { mentorId } = req.params;
    const now = new Date();
    const scheduledCalls = await prisma.callSession.findMany({
      where: {
        mentor_id: mentorId,
        status: 'scheduled',
        scheduledAt: { gte: now }
      },
      select: {
        scheduledAt: true,
        scheduledDuration: true
      }
    });
    res.json({ scheduledCalls });
  } catch (error) {
    console.error('Error fetching mentor schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// GET /api/calls/student/sessions
router.get('/student/sessions', authenticateUser, async (req, res) => {
  try {
    const sessions = await prisma.callSession.findMany({
      where: { 
        student_id: req.user?.id,
        status: { in: ['completed', 'settled'] }
      },
      include: {
        mentor: {
          include: {
            mentorProfile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(sessions);
  } catch (e) {
    console.error('Fetch student sessions error:', e);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/calls/student/schedule
router.get('/student/schedule', authenticateUser, async (req, res) => {
  try {
    const now = new Date();
    const scheduledCalls = await prisma.callSession.findMany({
      where: {
        student_id: req.user?.id,
        status: 'scheduled',
        scheduledAt: { gte: now }
      },
      select: {
        scheduledAt: true,
        scheduledDuration: true
      }
    });
    res.json({ scheduledCalls });
  } catch (error) {
    console.error('Error fetching student schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// GET /api/calls/student/upcoming
router.get('/student/upcoming', authenticateUser, async (req, res) => {
  try {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const upcoming = await prisma.callSession.findFirst({
      where: {
        student_id: req.user?.id,
        status: 'scheduled',
        scheduledAt: {
          gte: now,
          lte: endOfDay
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    res.json(upcoming);
  } catch (e) {
    console.error('Fetch upcoming call error:', e);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/calls/:id/start
router.post('/:id/start', authenticateUser, async (req, res) => {
  try {
    await prisma.callSession.update({
      where: { id: req.params.id as string},
      data: { status: 'active', startedAt: new Date(), lastHeartbeatAt: new Date() }
    });
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// PATCH /api/calls/:id/heartbeat
router.patch('/:id/heartbeat', authenticateUser, async (req, res) => {
  try {
    await prisma.callSession.update({
      where: { id: req.params.id as string },
      data: { lastHeartbeatAt: new Date() }
    });
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/calls/:id/end
router.post('/:id/end', authenticateUser, async (req, res) => {
  try {
    const session = await prisma.callSession.findUnique({ where: { id: req.params.id as string} });
    if (!session || session.status !== 'active') {
      return res.status(400).json({ error: 'Call is not active' });
    }

    const endedAt = new Date();
    const durationSecs = session.startedAt ? Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000) : 0;

    await prisma.callSession.update({
      where: { id: req.params.id as string},
      data: { endedAt }
    });

    // Release mentor
    await setAvailable(session.mentor_id);

    // Atomic billing
    await settleBilling(session.id, durationSecs);

    res.sendStatus(200);
  } catch (e) {
    console.error('Call end error:', e);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/calls/:id/rate
router.post('/:id/rate', authenticateUser, async (req, res) => {
  const { score, comment } = req.body;
  if (!score || score < 1 || score > 5) {
    return res.status(400).json({ error: 'Score must be between 1 and 5' });
  }

  try {
    const session = await prisma.callSession.findUnique({ where: { id: req.params.id as string} });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await prisma.$transaction(async (tx) => {
      await tx.rating.create({
        data: {
          sessionId: session.id,
          studentId: req.user?.id,
          mentorId: session.mentor_id,
          score,
          comment
        }
      });

      const avg = await tx.rating.aggregate({
        where: { mentorId: session.mentor_id },
        _avg: { score: true }
      });

      await tx.mentorProfile.update({
        where: { mentorId: session.mentor_id },
        data: {
          avg_rating: avg._avg.score || 0,
          total_calls: { increment: 1 }
        }
      });
    });
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
