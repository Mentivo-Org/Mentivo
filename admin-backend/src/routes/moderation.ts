import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth.ts';
import {
  getFlaggedMessages,
  getModerationStats,
  getValidationRules,
  createValidationRule,
  updateValidationRule,
  getAgoraSensitiveWords,
  addAgoraSensitiveWords
} from '../controllers/moderationController.ts';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

router.get('/flagged-messages', getFlaggedMessages);
router.get('/stats', getModerationStats);

router.get('/rules', getValidationRules);
router.post('/rules', createValidationRule);
router.patch('/rules/:id', updateValidationRule);

router.get('/agora/sensitive-words', getAgoraSensitiveWords);
router.post('/agora/sensitive-words', addAgoraSensitiveWords);

export default router;
