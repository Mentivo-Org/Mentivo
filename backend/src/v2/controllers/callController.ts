import type { Request, Response } from 'express';
import { generateToken, generateChannelName } from '../services/agora.ts';
import { lockToBusy, getPresenceState, setAvailable, setOffline, getAvailableMentors } from '../services/presence.ts';
import { settleBilling } from '../services/billing.ts';
import { sendCallSignalingMessage, sendCallCancelledMessage, sendChatPushNotification, sendCallStatusMessage } from '../services/notifications.ts';
import { emitToUser } from '../config/socket.ts';
import prisma from '../config/db.ts';
import redis from '../config/redis.ts';
import { chatSessionService } from '../services/chat/chatSession.ts';
import { chatMessageService } from '../services/chat/chatMessage.ts';
import { agoraChatRestService } from '../services/agoraChat.ts';
import { getMentorActiveRate, getMentorActiveRateByProfile, getFreeCallDurationMins, isFreeCallEnabled } from '../utils/pricing.ts';
import { toAgoraUserId } from '../utils/agoraUtils.ts';
import crypto from 'crypto';


export function scheduleMissedCallTimeout(sessionId: string, studentId: string, mentorId: string) {
  setTimeout(async () => {
    try {
      const session = await prisma.callSession.findUnique({ where: { id: sessionId } });
      
      // Only transition to 'missed' if it's still in 'calling', 'ringing' or 'pending' state
      if (session && (session.status === 'calling' || session.status === 'ringing' || session.status === 'pending')) {
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
        
        // Send FCM cancellation to mentor to dismiss notification
        const mentorFcmToken = await prisma.fCMToken.findFirst({
          where: { userId: mentorId },
          orderBy: { updatedAt: 'desc' },
          select: { token: true }
        });
        if (mentorFcmToken) {
          await sendCallCancelledMessage(mentorFcmToken.token, sessionId);
        }
        
        // Send FCM status to caller
        const studentFcmTokens = await prisma.fCMToken.findMany({
          where: { userId: studentId },
          orderBy: { updatedAt: 'desc' },
          select: { token: true }
        });
        for (const t of studentFcmTokens) {
          await sendCallStatusMessage(t.token, sessionId, 'missed');
        }

        console.log(`[Timeout] Call ${sessionId} marked as missed after 60s.`);
      }
    } catch (err) {
      console.error(`[Timeout Error] Failed to handle timeout for call ${sessionId}:`, err);
    }
  }, 60000);
}

export const initiateCall = async (req: Request, res: Response) => {
  const { mentorId } = req.body;
  const studentId = req.user?.id;

  try {
    // 1. Check Mentor Availability
    const mentorState = await getPresenceState(mentorId);
    console.log(mentorState);
    if (mentorState !== 'available') {
      return res.status(400).json({ error: 'Mentor is currently offline or busy' });
    }

    // 2. Validate student wallet balance (min ₹10)
    const wallet = await prisma.wallet.findUnique({ where: { userId: studentId } });
    if (!wallet || Number(wallet.balance) < 10) {
      return res.status(402).json({ error: 'Insufficient wallet balance (Minimum ₹10)' });
    }

    // 3. Check if free call is available on user profile
    const freeEnabled = await isFreeCallEnabled();
    const temp_student = await prisma.user.findUnique({where: {id: studentId}})
    const isFree = freeEnabled && temp_student?.isFreeAvailable === true;
    
    // 4. Lock Mentor
    await lockToBusy(mentorId);

    // 5. Create Session
    const channelName = generateChannelName(studentId as string, mentorId);
    if (!channelName) {
      return res.status(500).json({ error: 'Failed to generate channel ID' });
    }

    // 6. Calculate Max Affordable Duration (fetch rate before creating session to persist it)
    const { ratePerMin } = await getMentorActiveRate(mentorId);

    const session = await prisma.callSession.create({
      data: {
        student_id: studentId as string,
        mentor_id: mentorId as string,
        agoraChannelId: channelName,
        status: 'calling', // Set to calling immediately
        is_free: isFree,
        ratePerMin
      }
    });
    
    const affordableMinutes = Math.floor(Number(wallet.balance) / ratePerMin);
    const bufferSeconds = 60;
    const freeMins = await getFreeCallDurationMins();
    const freeSeconds = freeMins * 60;
    const maxAllowedSeconds = (affordableMinutes * 60) + (isFree ? freeSeconds : 0) + bufferSeconds;

    // 7. Generate Agora Tokens
    const studentToken = generateToken(channelName, studentId as string, maxAllowedSeconds);
    const mentorToken = generateToken(channelName, mentorId, 3600);
    
    // 8. Trigger Signaling (Socket.io + FCM)
    const [student, mentor] = await Promise.all([
      prisma.user.findUnique({ where: { id: studentId }, select: { name: true, photo_url: true } }),
      prisma.user.findUnique({ where: { id: mentorId }, select: { photo_url: true } })
    ]);
    
    // 10. Get or Create Chat Session
    let chatSessionId: string | null = null;
    try {
      const agoraConvId = `${studentId}_${mentorId}`;
      const chatSession = await chatSessionService.getOrCreateSession(studentId as string, mentorId, agoraConvId);
      chatSessionId = chatSession.id;
      
      // Link the chat session to this call session
      await prisma.chatSession.update({
        where: { id: chatSession.id },
        data: { 
          callSessionId: session.id,
          isInCallChat: true
        }
      });
    } catch (chatErr) {
      console.error('Failed to auto-create chat session during call:', chatErr);
    }

    // 8a. Socket emission for instant ringing
    emitToUser(mentorId, 'incoming_call_v2', {
      callId: session.id,
      channelName,
      callerName: student?.name || 'Student',
      callerPhoto: student?.photo_url,
      chatSessionId
    });

    // 8b. FCM push for background wake-up
    const mentorFcmTokens = await prisma.fCMToken.findMany({
      where: { userId: mentorId },
      select: { token: true }
    });

    if (!mentorFcmTokens || mentorFcmTokens.length === 0) {
      console.warn(`[initiateCall] FCM token not found for mentor ${mentorId}. Setting mentor to offline.`);
      await setOffline(mentorId);
      await prisma.callSession.update({
        where: { id: session.id },
        data: { status: 'failed', endedAt: new Date() }
      });
      return res.status(400).json({ error: 'Mentor FCM token not found. Mentor is offline.' });
    }

    for (const tokenObj of mentorFcmTokens) {
      await sendCallSignalingMessage(tokenObj.token, {
        callId: session.id,
        channelName,
        callerName: student?.name || 'Student',
        callerPhoto: student?.photo_url,
        chatSessionId
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
      maxDurationSeconds: maxAllowedSeconds,
      mentorPhoto: mentor?.photo_url,
      chatSessionId
    });
  } catch (error) {
    console.error('Call initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
};

export const scheduleCall = async (req: Request, res: Response) => {
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

    const { ratePerMin: scheduledRatePerMin } = await getMentorActiveRate(mentorId as string);

    const session = await prisma.callSession.create({
      data: {
        student_id: studentId as string,
        mentor_id: mentorId as string,
        agoraChannelId: channelName as string,
        status: 'scheduled',
        scheduledAt: scheduledDate,
        scheduledDuration: parseInt(durationMins),
        ratePerMin: scheduledRatePerMin
      }
    });

    // Send chat message automatically
    (async () => {
      try {
        const agoraConvId = `${studentId}_${mentorId}`;
        const chatSession = await chatSessionService.getOrCreateSession(studentId as string, mentorId as string, agoraConvId);
        
        const formattedDate = new Date(scheduledAt).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        const content = `Scheduled a call for ${formattedDate}.`;

        const agoraFrom = toAgoraUserId(studentId as string);
        const agoraTo = toAgoraUserId(mentorId as string);
        let msgId = Date.now().toString();

        try {
          const agoraResult = await agoraChatRestService.sendMessage(agoraFrom, agoraTo, content);
          msgId = agoraResult.data?.[agoraTo] || msgId;
        } catch (agoraErr) {
          console.error('Failed to send Agora message for scheduled call:', agoraErr);
        }

        await chatMessageService.create({
          agoraMsgId: msgId,
          chatSessionId: chatSession.id,
          senderId: studentId as string,
          content,
          status: 'sent',
          validationResult: { isValid: true, violations: [] }
        });

        await chatSessionService.updateLastMessage(chatSession.id, studentId as string);

        // Notify via push notification
        const tokens = await prisma.fCMToken.findMany({
          where: { userId: mentorId },
          select: { token: true }
        });
        const fcmTokens = tokens.map(t => t.token);
        if (fcmTokens.length > 0) {
          const studentUser = await prisma.user.findUnique({ where: { id: studentId as string }, select: { name: true } });
          const senderName = studentUser?.name || 'Student';
          await sendChatPushNotification(fcmTokens, {
            sessionId: chatSession.id,
            senderId: studentId as string,
            senderName,
            message: content
          });
        }
      } catch (chatErr) {
        console.error('Error handling chat message for scheduleCall:', chatErr);
      }
    })();

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
};

export const getMentorSchedule = async (req: Request, res: Response) => {
  try {
    const mentorId = req.params.mentorId as string;
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
};

export const getMentorSessions = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const statusQuery = req.query.status as string;

    const statusFilter = statusQuery
      ? { equals: statusQuery }
      : { in: ['completed', 'settled'] };

    const sessions = await prisma.callSession.findMany({
      where: { 
        mentor_id: req.user?.id,
        status: statusFilter
      },
      include: {
        student: {
          select: { name: true, email: true, photo_url: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    res.json(sessions);
  } catch (e) {
    console.error('Fetch mentor sessions error:', e);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const getStudentSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.callSession.findMany({
      where: { 
        student_id: req.user?.id,
        status: { in: ['completed', 'settled'] }
      },
      include: {
        mentor: {
          include: {
            mentorProfile: true,
            _count: {
              select: {
                callSessionsMentor: {
                  where: { status: { in: ['completed', 'settled'] } }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedSessions = sessions.map(s => {
      const session: any = { ...s };
      if (session.mentor?.mentorProfile) {
        session.mentor.mentorProfile.total_calls = session.mentor._count?.callSessionsMentor || 0;
      }
      return session;
    });

    res.json(formattedSessions);
  } catch (e) {
    console.error('Fetch student sessions error:', e);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const getStudentSchedule = async (req: Request, res: Response) => {
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
};

export const getStudentUpcoming = async (req: Request, res: Response) => {
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
      include: {
        mentor: true
      },
      orderBy: { scheduledAt: 'asc' }
    });

    res.json(upcoming);
  } catch (e) {
    console.error('Fetch upcoming call error:', e);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const startCall = async (req: Request, res: Response) => {
  try {
    const session = await prisma.callSession.update({
      where: { id: req.params.id as string},
      data: { status: 'active', startedAt: new Date(), lastHeartbeatAt: new Date() }
    });

    // Notify the other party that call is connected
    const otherPartyId = req.user?.id === session.student_id ? session.mentor_id : session.student_id;
    emitToUser(otherPartyId, 'call_status_changed', { callId: session.id, status: 'active' });

    await prisma.user.update({
      where: {id: session.student_id},
      data: {
        isFreeAvailable: false
      }
    })
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ error: 'Server Error' });
  }
};

export const setCallRinging = async (req: Request, res: Response) => {
  try {
    const session = await prisma.callSession.findUnique({ where: { id: req.params.id as string } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    if (session.status !== 'ringing') {
      await prisma.callSession.update({
        where: { id: req.params.id as string},
        data: { status: 'ringing' }
      });
      console.log(`[Ringing] Call ${session.id} status updated to ringing`);
      // Notify the student that mentor's phone is ringing
      emitToUser(session.student_id, 'call_status_changed', { callId: session.id, status: 'ringing' });
      
      // Notify the student that mentor's phone is ringing via FCM
      const callerFcmTokens = await prisma.fCMToken.findMany({
        where: { userId: session.student_id },
        orderBy: { updatedAt: 'desc' },
        select: { token: true }
      });
      for (const t of callerFcmTokens) {
        await sendCallStatusMessage(t.token, session.id, 'ringing');
      }
    }

    res.sendStatus(200);
  } catch (e) {
    console.error('Ringing status update error:', e);
    res.status(500).json({ error: 'Server Error' });
  }
};

export async function performEndCall(sessionId: string) {
  const session = await prisma.callSession.findUnique({ where: { id: sessionId } });
  if (!session || !['active', 'calling', 'ringing'].includes(session.status)) {
    return;
  }

  const endedAt = new Date();
  const durationSecs = session.startedAt ? Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000) : 0;
  const finalStatus = session.status === 'active' ? 'completed' : 'cancelled';

  await prisma.callSession.update({
    where: { id: sessionId },
    data: { endedAt, status: finalStatus }
  });

  // Release mentor
  await setAvailable(session.mentor_id);

  // Notify student and mentor
  emitToUser(session.student_id, 'call_status_changed', { callId: session.id, status: finalStatus });
  emitToUser(session.mentor_id, 'call_status_changed', { callId: session.id, status: finalStatus });

  // Send FCM cancellation to mentor
  const mentorFcmToken = await prisma.fCMToken.findFirst({
    where: { userId: session.mentor_id },
    orderBy: { updatedAt: 'desc' },
    select: { token: true }
  });
  if (mentorFcmToken) {
    await sendCallCancelledMessage(mentorFcmToken.token, session.id);
  }

  // Send FCM status to caller
  const studentFcmTokens = await prisma.fCMToken.findMany({
    where: { userId: session.student_id },
    orderBy: { updatedAt: 'desc' },
    select: { token: true }
  });
  for (const t of studentFcmTokens) {
    await sendCallStatusMessage(t.token, session.id, finalStatus);
  }

  // Atomic billing
  if (finalStatus === 'completed') {
    await settleBilling(session.id, durationSecs);
  }
}

export const sendHeartbeat = async (req: Request, res: Response) => {
  try {
    const session = await prisma.callSession.update({
      where: { id: req.params.id as string },
      data: { lastHeartbeatAt: new Date() }
    });

    // Reported back to the client so its call timer stays anchored to server
    // time instead of drifting from a local Date.now() taken at Agora join.
    let elapsedSecs: number | null = null;
    let remainingSecs: number | null = null;

    if (session.status === 'active') {
      await lockToBusy(session.mentor_id);

      // Fetch student wallet and mentor rate for live balance check
      const detailedSession = await prisma.callSession.findUnique({
        where: { id: session.id },
        include: {
          student: { include: { wallet: true } },
          mentor: { include: { mentorProfile: true } }
        }
      });

      if (detailedSession && detailedSession.startedAt) {
        elapsedSecs = Math.floor((Date.now() - detailedSession.startedAt.getTime()) / 1000);
        const { ratePerMin } = await getMentorActiveRateByProfile(detailedSession.mentor?.mentorProfile);
        const isFree = detailedSession.is_free;
        const walletBalance = Number(detailedSession.student?.wallet?.balance || 0);

        const maxBillableMins = Math.floor(walletBalance / ratePerMin);
        const allowedBillableSecs = maxBillableMins * 60;
        const freeMins = await getFreeCallDurationMins();
        const freeSeconds = freeMins * 60;
        const totalAllowedSecs = allowedBillableSecs + (isFree ? freeSeconds : 0);

        remainingSecs = totalAllowedSecs - elapsedSecs;

        if (remainingSecs <= 0) {
          console.log(`[Heartbeat] Terminating session ${session.id} due to zero balance.`);
          await performEndCall(session.id);
        } else if (remainingSecs <= 180) {
          const warningKey = `call-warning:${session.id}`;
          const alreadyWarned = await redis.get(warningKey);
          if (!alreadyWarned) {
            await redis.set(warningKey, 'true', 'EX', 3600);
            const { sendCallWarningNotification } = await import('../services/notifications.ts');
            await sendCallWarningNotification(detailedSession.student_id);
          }
        }
      }
    }

    res.json({ elapsedSecs, remainingSecs });
  } catch (e) {
    console.error('Heartbeat error:', e);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const endCall = async (req: Request, res: Response) => {
  try {
    await performEndCall(req.params.id as string);
    res.sendStatus(200);
  } catch (e) {
    console.error('Call end error:', e);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const rejectCall = async (req: Request, res: Response) => {
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

    // Send FCM cancellation to mentor to dismiss notification
    const mentorFcmToken = await prisma.fCMToken.findFirst({
      where: { userId: session.mentor_id },
      orderBy: { updatedAt: 'desc' },
      select: { token: true }
    });
    if (mentorFcmToken) {
      await sendCallCancelledMessage(mentorFcmToken.token, session.id);
    }
    
    // Send FCM to caller
    const callerFcmTokens = await prisma.fCMToken.findMany({
      where: { userId: callerId },
      orderBy: { updatedAt: 'desc' },
      select: { token: true }
    });
    for (const t of callerFcmTokens) {
      await sendCallStatusMessage(t.token, session.id, 'rejected');
    }

    res.sendStatus(200);
  } catch (e) {
    console.error('Call reject error:', e);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const getAgoraToken = async (req: Request, res: Response) => {
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
};

export const getCallStatus = async (req: Request, res: Response) => {
  try {
    const callId = req.params.id as string;
    
    // Check if this call is part of a broadcast
    const broadcastGroupId = await redis.get(`broadcast_member:${callId}`);
    
    if (broadcastGroupId) {
      // It is part of a broadcast. Let's see if we can claim it.
      // 1. Try to acquire the lock (only one callId can win)
      const claimed = await redis.setnx(`broadcast_lock:${broadcastGroupId}`, callId);
      
      if (claimed === 1) {
        // We won!
        await redis.set(`broadcast:${broadcastGroupId}`, `claimed:${callId}`, 'EX', 30);
        
        // Find other members of this broadcast to cancel them
        const membersJson = await redis.get(`broadcast_members_list:${broadcastGroupId}`);
        if (membersJson) {
          const members: string[] = JSON.parse(membersJson);
          const otherMembers = members.filter((id: string) => id !== callId);
          
          if (otherMembers.length > 0) {
            // Update DB to missed for other members
            await prisma.callSession.updateMany({
              where: { id: { in: otherMembers } },
              data: { status: 'missed' }
            });
            
            // Send cancellation push and socket events to other mentors
            const otherSessions = await prisma.callSession.findMany({
              where: { id: { in: otherMembers } },
              select: { id: true, mentor_id: true }
            });
            
            for (const other of otherSessions) {
              const otherMentorFcm = await prisma.fCMToken.findFirst({
                where: { userId: other.mentor_id },
                orderBy: { updatedAt: 'desc' }
              });
              if (otherMentorFcm?.token) {
                await sendCallCancelledMessage(otherMentorFcm.token, other.id);
              }
              emitToUser(other.mentor_id, 'call_status_changed', { callId: other.id, status: 'missed' });
            }
          }
        }
      } else {
        // Someone else won.
        // Update this specific call session to missed if it isn't already
        await prisma.callSession.update({
          where: { id: callId },
          data: { status: 'missed' }
        });
        
        // Return missed so the frontend gracefully drops out
        return res.json({
          status: 'missed',
          chatSessionId: null,
          student: null,
          mentor: null,
          is_free: true,
          startedAt: null,
          serverNow: new Date()
        });
      }
    }

    // Normal behavior
    const session = await prisma.callSession.findUnique({ 
      where: { id: callId },
      include: {
        student: { select: { id: true, name: true, photo_url: true } },
        mentor: { select: { id: true, name: true, photo_url: true } },
        chatSessions: { select: { id: true } }
      }
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const chatSessionId = session.chatSessions?.[0]?.id || null;

    res.json({
      status: session.status,
      chatSessionId,
      student: session.student,
      mentor: session.mentor,
      is_free: session.is_free,
      // Timer anchor. `startedAt` is null until the callee POSTs /start, so the
      // caller only gets a real value once the call flips to active. `serverNow`
      // lets the client subtract out device/server clock skew.
      startedAt: session.startedAt,
      serverNow: new Date()
    });
  } catch (e) {
    console.error('Get call status error:', e);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const rateCall = async (req: Request, res: Response) => {
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
          avg_rating: avg._avg.score || 0
        }
      });
    });
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Server Error' });
  }
};

export const freeMatchmaking = async (req: Request, res: Response) => {
  const studentId = req.user?.id;
  try {
    // 0. Check if free call scheme is globally enabled
    const freeEnabled = await isFreeCallEnabled();
    if (!freeEnabled) {
      return res.status(400).json({ error: 'The free call scheme is currently unavailable.' });
    }

    // 1. Verify eligibility
    const student = await prisma.user.findFirst({
      where: { id: studentId }
    });
    if (student?.isFreeAvailable === false) {
      return res.status(400).json({ error: 'You are only eligible for the first free call.' });
    }

    // 2. Find online, available mentors
    const availableMentorIds = await getAvailableMentors();
    if (availableMentorIds.length === 0) {
      return res.status(404).json({ error: 'No mentors are online right now. Please try again later!' });
    }

    const availableMentors = await prisma.user.findMany({
      where: { id: { in: availableMentorIds } },
      include: { mentorProfile: true }
    });

    if (availableMentors.length === 0) {
      return res.status(404).json({ error: 'Failed to match with an online mentor. Please try again.' });
    }

    availableMentors.sort((a, b) => {
      const callsA = a.mentorProfile?.total_calls || 0;
      const callsB = b.mentorProfile?.total_calls || 0;
      return callsA - callsB;
    });

    // 3. Pick up to 6 mentors for simultaneous ringing
    const selectedMentors = availableMentors.slice(0, 6);
    
    const broadcastGroupId = crypto.randomUUID();
    await redis.set(`broadcast:${broadcastGroupId}`, 'pending', 'EX', 35);
    
    const freeMins = await getFreeCallDurationMins();
    const freeSeconds = freeMins * 60;
    const maxAllowedSeconds = freeSeconds;
    
    const createdSessionIds: string[] = [];
    
    // Create sessions and send push notifications
    for (const mentor of selectedMentors) {
      const matchedMentorId = mentor.mentorProfile?.mentorId;
      if (!matchedMentorId) continue;
      
      const { ratePerMin: broadcastRate } = await getMentorActiveRateByProfile(mentor.mentorProfile);
      const channelName = generateChannelName(studentId as string, matchedMentorId);
      
      const session = await prisma.callSession.create({
        data: {
          student_id: studentId as string,
          mentor_id: matchedMentorId,
          agoraChannelId: channelName,
          status: 'calling',
          is_free: true,
          startedAt: new Date(),
          ratePerMin: broadcastRate
        }
      });
      
      createdSessionIds.push(session.id);
      
      // Map session to broadcast group
      await redis.set(`broadcast_member:${session.id}`, broadcastGroupId, 'EX', 35);
      
      const agoraConvId = `${studentId}_${matchedMentorId}`;
      const chatSession = await chatSessionService.getOrCreateSession(studentId as string, matchedMentorId, agoraConvId);
      
      const mentorFcmToken = await prisma.fCMToken.findFirst({
        where: { userId: matchedMentorId },
        orderBy: { updatedAt: 'desc' },
        select: { token: true }
      });
      
      if (mentorFcmToken?.token) {
        await sendCallSignalingMessage(mentorFcmToken.token, {
          callId: session.id,
          channelName: channelName as string,
          callerName: req.user?.name || 'Student',
          callerPhoto: req.user?.photo_url,
          chatSessionId: chatSession.id
        });
      }
      
      scheduleMissedCallTimeout(session.id, studentId as string, matchedMentorId);
    }
    
    await redis.set(`broadcast_members_list:${broadcastGroupId}`, JSON.stringify(createdSessionIds), 'EX', 35);

    // 4. Polling loop: Wait for a mentor to claim the call
    let claimedCallId: string | null = null;
    for (let i = 0; i < 30; i++) { // wait up to 30 seconds
      await new Promise(resolve => setTimeout(resolve, 1000));
      const status = await redis.get(`broadcast:${broadcastGroupId}`);
      if (status && status.startsWith('claimed:')) {
        claimedCallId = status.split(':')[1];
        break;
      }
    }
    
    if (claimedCallId) {
      // Someone accepted!
      const winningSession = await prisma.callSession.findUnique({
        where: { id: claimedCallId },
        include: { mentor: { select: { photo_url: true, name: true } } }
      });
      
      if (winningSession) {
        const studentToken = generateToken(winningSession.agoraChannelId as string, studentId as string);
        const mentorToken = generateToken(winningSession.agoraChannelId as string, winningSession.mentor_id);
        const agoraConvId = `${studentId}_${winningSession.mentor_id}`;
        const chatSession = await chatSessionService.getOrCreateSession(studentId as string, winningSession.mentor_id, agoraConvId);
        
        // Lock winning mentor to busy
        await lockToBusy(winningSession.mentor_id);
        
        return res.json({
          sessionId: winningSession.id,
          channelName: winningSession.agoraChannelId,
          studentToken,
          mentorToken,
          isFree: true,
          maxDurationSeconds: maxAllowedSeconds,
          mentorPhoto: winningSession.mentor?.photo_url,
          chatSessionId: chatSession.id,
          mentorName: winningSession.mentor?.name
        });
      }
    }
    
    // 5. Timeout - No one answered
    // Cancel all sessions
    await prisma.callSession.updateMany({
      where: { id: { in: createdSessionIds } },
      data: { status: 'missed' }
    });
    
    for (const sessionId of createdSessionIds) {
      const session = await prisma.callSession.findUnique({
        where: { id: sessionId },
        select: { mentor_id: true }
      });
      if (session) {
        const mentorFcm = await prisma.fCMToken.findFirst({
          where: { userId: session.mentor_id },
          orderBy: { updatedAt: 'desc' }
        });
        if (mentorFcm?.token) {
          await sendCallCancelledMessage(mentorFcm.token, sessionId);
        }
        emitToUser(session.mentor_id, 'call_status_changed', { callId: sessionId, status: 'missed' });
      }
    }
    
    return res.status(404).json({ error: 'No mentors answered. Please try again later!' });
    
  } catch (error) {
    console.error('Free matchmaking error:', error);
    res.status(500).json({ error: 'Failed to process free matchmaking' });
  }
};
