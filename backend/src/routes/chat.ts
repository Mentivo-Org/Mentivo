import { Router } from 'express';
import { authenticateUser } from '../auth/authenticateUser.ts';
import {
  getOrCreateChatSession,
  getUserChatSessions,
  getChatMessages,
  getChatToken,
  markAsRead,
  sendMessage,
  blockUser,
  reportMessage,
  linkChatToCall,
} from '../controllers/chatController.ts';

const router = Router();

router.use(authenticateUser);

router.post('/sessions', getOrCreateChatSession);
router.get('/sessions', getUserChatSessions);
router.get('/sessions/:sessionId/messages', getChatMessages);
router.post('/sessions/:sessionId/messages', sendMessage);

router.get('/token', getChatToken);

router.patch('/sessions/:sessionId/read', markAsRead);
router.post('/sessions/:sessionId/block', blockUser);
router.post('/messages/:messageId/report', reportMessage);

router.post('/sessions/:sessionId/link-call', linkChatToCall);

export default router;
