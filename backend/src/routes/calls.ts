import { Router } from 'express';
import { authenticateUser } from '../auth/authenticateUser.ts';
import { generateToken, generateChannelName } from '../services/agora.ts';
import { lockToBusy, getPresenceState, setAvailable } from '../services/presence.ts';
import { settleBilling } from '../services/billing.ts';
import { sendCallSignalingMessage } from '../services/notifications.ts';
import { emitToUser } from '../config/socket.ts';
import prisma from '../config/db.ts';

const router = Router();

/**
 * Missed Call Timeout Handler
 * Marks call as missed if not accepted within 60s
 */
function scheduleMissedCallTimeout(sessionId: string, studentId: string, mentorId: string) {
  setTimeout(async () => {
    try {
      const session = await prisma.callSession.findUnique({ where: { id: sessionId } });
      
      // Only transition to 'missed' if it's still in 'calling' or 'pending' state
      if (session && (session.status === 'calling' || session.status === 'pending')) {
        await prisma.callSession.update({
          where: { id: sessionId },
          data: { status: 'missed', endedAt: new Date() }
        });

        // Release mentor busy lock
        await setAvailable(mentorId);

        // Notify both parties
        const payload = { callId: sessionId, status: 'missed' };
        emitToUser(studentId, 'call_status_changed', payload);
        emitToUser(mentorId, 'call_status_changed', payload);
        
        console.log(`[Timeout] Call ${sessionId} marked as missed after 60s.`);
      }
    } catch (err) {
      console.error(`[Timeout Error] Failed to handle timeout for call ${sessionId}:`, err);
    }
  }, 60000);
}

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
        status: 'calling', // Set to calling immediately
        is_free: isFree
      }
    });

    // 6. Calculate Max Affordable Duration (INR 10/min)
    const affordableMinutes = Math.floor(Number(wallet.balance) / 10);
    const bufferSeconds = 60;
    const maxAllowedSeconds = (affordableMinutes * 60) + (isFree ? 300 : 0) + bufferSeconds;

    // 7. Generate Agora Tokens
    const studentToken = generateToken(channelName, studentId as string, maxAllowedSeconds);
    const mentorToken = generateToken(channelName, mentorId, 3600);

    // 8. Trigger Signaling (Socket.io + FCM)
    const student = await prisma.user.findUnique({ where: { id: studentId }, select: { name: true } });
    
    // 8a. Socket emission for instant ringing
    emitToUser(mentorId, 'incoming_call', {
      callId: session.id,
      channelName,
      callerName: student?.name || 'Student'
    });

    // 8b. FCM push for background wake-up
    const mentorFcmToken = await prisma.fCMToken.findFirst({
      where: { userId: mentorId },
      orderBy: { updatedAt: 'desc' },
      select: { token: true }
    });

    if (mentorFcmToken) {
      await sendCallSignalingMessage(mentorFcmToken.token, {
        callId: session.id,
        channelName,
        callerName: student?.name || 'Student'
      });
    }

    // 9. Start Missed Call Timeout (60s)
    scheduleMissedCallTimeout(session.id, studentId as string, mentorId);

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

// GET /api/calls/mentor/sessions
router.get('/mentor/sessions', authenticateUser, async (req, res) => {
  try {
    const sessions = await prisma.callSession.findMany({
      where: { 
        mentor_id: req.user?.id,
        status: { in: ['completed', 'settled'] }
      },
      include: {
        student: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json(sessions);
  } catch (e) {
    console.error('Fetch mentor sessions error:', e);
    res.status(500).json({ error: 'Server Error' });
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
    const session = await prisma.callSession.update({
      where: { id: req.params.id as string},
      data: { status: 'active', startedAt: new Date(), lastHeartbeatAt: new Date() }
    });

    // Notify the other party that call is connected
    const otherPartyId = req.user?.id === session.student_id ? session.mentor_id : session.student_id;
    emitToUser(otherPartyId, 'call_status_changed', { callId: session.id, status: 'active' });

    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// PATCH /api/calls/:id/heartbeat
router.patch('/:id/heartbeat', authenticateUser, async (req, res) => {
  try {
    const session = await prisma.callSession.update({
      where: { id: req.params.id as string },
      data: { lastHeartbeatAt: new Date() }
    });

    // Also update mentor presence to busy
    if (session.status === 'active') {
      await lockToBusy(session.mentor_id);
    }

    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/calls/:id/end
router.post('/:id/end', authenticateUser, async (req, res) => {
  try {
    const session = await prisma.callSession.findUnique({ where: { id: req.params.id as string} });
    if (!session || (session.status !== 'active' && session.status !== 'calling')) {
      return res.status(400).json({ error: 'Call is not active or ringing' });
    }

    const endedAt = new Date();
    const durationSecs = session.startedAt ? Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000) : 0;

    await prisma.callSession.update({
      where: { id: req.params.id as string},
      data: { endedAt, status: 'completed' }
    });

    // Release mentor
    await setAvailable(session.mentor_id);

    // Notify the other party
    const otherPartyId = req.user?.id === session.student_id ? session.mentor_id : session.student_id;
    emitToUser(otherPartyId, 'call_status_changed', { callId: session.id, status: 'completed' });

    // Atomic billing
    await settleBilling(session.id, durationSecs);

    res.sendStatus(200);
  } catch (e) {
    console.error('Call end error:', e);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST /api/calls/:id/reject
router.post('/:id/reject', authenticateUser, async (req, res) => {
  try {
    const session = await prisma.callSession.findUnique({ where: { id: req.params.id as string } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await prisma.callSession.update({
      where: { id: req.params.id as string },
      data: { status: 'rejected', endedAt: new Date() }
    });

    // Release mentor
    await setAvailable(session.mentor_id);

    // Notify the caller
    const callerId = req.user?.id === session.mentor_id ? session.student_id : session.mentor_id;
    emitToUser(callerId, 'call_status_changed', { callId: session.id, status: 'rejected' });

    res.sendStatus(200);
  } catch (e) {
    console.error('Call reject error:', e);
    res.status(500).json({ error: 'Server Error' });
  }
});

// GET /api/calls/:id/token
router.get('/:id/token', authenticateUser, async (req, res) => {
  try {
    const session = await prisma.callSession.findUnique({ where: { id: req.params.id as string } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const userId = req.user?.id;
    if (session.student_id !== userId && session.mentor_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const channelName = session.agoraChannelId;
    if (!channelName) return res.status(500).json({ error: 'Channel name missing' });

    // For simplicity, generate a fresh token for 1hr. 
    // In production, you might want to match the student's wallet-limited duration.
    const token = generateToken(channelName, userId as string, 3600);

    res.json({ token, channelName });
  } catch (e) {
    console.error('Get token error:', e);
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
