import type { Request, Response } from 'express';
import { chatSessionService } from '../services/chat/chatSession.ts';
import { chatMessageService } from '../services/chat/chatMessage.ts';
import { generateChatUserToken } from '../services/chat/tokenGenerator.ts';
import { agoraChatRestService } from '../services/agoraChat.ts';
import { validationEngine } from '../services/chat/validation.ts';
import { toAgoraUserId } from '../utils/agoraUtils.ts';
import prisma from '../config/db.ts';
import { sendChatPushNotification } from '../services/notifications.ts';

export const getOrCreateChatSession = async (req: Request, res: Response) => {
  const { mentorId } = req.body;
  const studentId = (req as any).user.id;

  try {
    const agoraConvId = `${studentId}_${mentorId}`;
    const session = await chatSessionService.getOrCreateSession(studentId, mentorId, agoraConvId);
    res.json(session);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserChatSessions = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const sessions = await chatSessionService.getUserSessions(userId);
  res.json(sessions);
};

export const getChatMessages = async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const { limit, cursor } = req.query;
  
  const messages = await chatMessageService.getSessionMessages(
    sessionId, 
    limit ? parseInt(limit as string) : 50, 
    cursor as string
  );
  
  res.json(messages);
};

export const sendMessage = async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const { content } = req.body;
  const userId = (req as any).user.id;

  const session = await chatSessionService.getById(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  // Validate message
  const validationResult = await validationEngine.validateMessage(userId, content, sessionId);
  if (!validationResult.isValid) {
    return res.status(400).json({ 
      error: 'Message violates community guidelines', 
      violations: validationResult.violations 
    });
  }

  const to = session.studentId === userId ? session.mentorId : session.studentId;

  try {
    const agoraFrom = toAgoraUserId(userId);
    const agoraTo = toAgoraUserId(to);
    const agoraResult = await agoraChatRestService.sendMessage(agoraFrom, agoraTo, content);
    
    // Webhooks are not available on the free plan, so we save the message directly to our DB here.
    // The Agora REST API response returns the msgId in the 'data' field, keyed by the recipient userId.
    const msgId = agoraResult.data?.[agoraTo] || Date.now().toString();
    
    await chatMessageService.create({
      agoraMsgId: msgId,
      chatSessionId: session.id,
      senderId: userId,
      content,
      validationResult: validationResult,
      status: 'sent'
    });

    await chatSessionService.updateLastMessage(session.id, userId);

    // Always notify the recipient — FCM/notifee handles both foreground and background.
    (async () => {
      try {
        const tokens = await prisma.fCMToken.findMany({
          where: { userId: to },
          select: { token: true },
        });
        const fcmTokens = tokens.map((t) => t.token);
        if (fcmTokens.length > 0) {
          const senderName = (req as any).user?.name || 'User';
          await sendChatPushNotification(fcmTokens, {
            sessionId: session.id,
            senderId: userId,
            senderName,
            message: content,
          });
        }
      } catch (err) {
        console.error('Error sending chat notification:', err);
      }
    })();

    res.json({ success: true, agoraMsgId: msgId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send message via Agora' });
  }
};

export const getChatToken = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const agoraUserId = toAgoraUserId(userId);
  const token = await generateChatUserToken(agoraUserId);
  
  try {
    const user = (req as any).user;
    await agoraChatRestService.registerUser(agoraUserId, user.name || 'User');
  } catch (error) {
    // Ignore if already exists
  }

  res.json({ token, userId: agoraUserId });
};

export const markAsRead = async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const userId = (req as any).user.id;
  try {
    await chatMessageService.markSessionAsRead(sessionId, userId);
    // Reset the unread counter on the session so the badge clears
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { messageCount: 0 },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const blockUser = async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  try {
    await chatSessionService.updateStatus(sessionId, 'blocked');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const reportMessage = async (req: Request, res: Response) => {
  const messageId = req.params.messageId as string;
  try {
    await chatMessageService.reportMessage(messageId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const linkChatToCall = async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const { callSessionId } = req.body;
  const userId = (req as any).user.id;

  try {
    const session = await chatSessionService.getById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    // Verify user is part of this chat session
    if (session.studentId !== userId && session.mentorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to link this chat session' });
    }

    await chatSessionService.linkToCall(sessionId, callSessionId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
