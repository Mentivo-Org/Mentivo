import { Request, Response } from 'express';
import prisma from '../../config/db.ts';
import { validationEngine } from './validation.ts';
import { chatMessageService } from './chatMessage.ts';
import { chatSessionService } from './chatSession.ts';
import { agoraChatRestService } from '../agoraChat.ts';
import { toStandardUuid } from '../../utils/agoraUtils.ts';
import crypto from 'crypto';


export async function handleAgoraChatWebhook(req: Request, res: Response) {
  const { event, callId, ...payload } = req.body;
  
  // Verify webhook signature if secret is provided
  const signature = req.headers['x-agora-signature'] as string;
  const secret = process.env.AGORA_CHAT_WEBHOOK_SECRET;
  
  if (secret && signature) {
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(JSON.stringify(req.body));
    const expectedSignature = hmac.digest('hex');
    if (signature !== expectedSignature) {
      await prisma.logEntry.create({
        data: {
          level: 'WARN',
          source: 'backend',
          message: 'Invalid Agora Chat webhook signature detected (potential spoofing)',
          metadata: { signature, expectedSignature, ip: req.ip }
        }
      }).catch(() => {});
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  try {
    switch (event) {
      case 'message_send':
        await handleMessageSend(payload);
        break;
      case 'message_delivered':
        await chatMessageService.updateStatus(payload.msg_id, 'delivered');
        break;
      case 'message_read':
        await chatMessageService.updateStatus(payload.msg_id, 'read');
        break;
    }
  } catch (error: any) {
    console.error('Agora Webhook Error:', error);
    await prisma.logEntry.create({
        data: {
            level: 'ERROR',
            source: 'backend',
            message: `Agora Chat webhook processing error: ${error.message}`,
            metadata: { error: error.stack, event }
        }
    }).catch(() => {});
    // Return 200 to Agora to avoid retries if we can't handle it
  }

  res.json({ success: true });
}

async function handleMessageSend(payload: any) {
  const { from, to, msg_id, payload: body } = payload;
  const content = body?.bodies?.[0]?.msg || '';
  
  const fromUuid = toStandardUuid(from);
  const toUuid = toStandardUuid(to);
  
  let chatSession = await chatSessionService.findByParticipants(fromUuid, toUuid);
  
  if (!chatSession) {
    // If session doesn't exist, we only allow students to create it by sending a message
    const sender = await prisma.user.findUnique({ where: { id: fromUuid } });
    if (!sender || sender.role !== 'student') {
      console.error('Unauthorized chat initiation: Only students can initiate a chat.');
      await agoraChatRestService.recallMessage(msg_id, from, to);
      return;
    }
    
    try {
      chatSession = await chatSessionService.getOrCreateSession(fromUuid, toUuid, `${fromUuid}_${toUuid}`);
    } catch (error) {
      console.error('Unauthorized chat initiation:', error);
      await agoraChatRestService.recallMessage(msg_id, from, to);
      return;
    }
  }
  
  const result = await validationEngine.validateMessage(fromUuid, content, chatSession.id);
  
  await chatMessageService.create({
    agoraMsgId: msg_id,
    chatSessionId: chatSession.id,
    senderId: fromUuid,
    content,
    validationResult: result,
    status: result.isValid ? 'sent' : 'blocked'
  });

  if (!result.isValid) {
    await agoraChatRestService.recallMessage(msg_id, from, to);
  } else {
    await chatSessionService.updateLastMessage(chatSession.id, fromUuid);
  }
}
