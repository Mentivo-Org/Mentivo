import { Router } from 'express';
import { authenticateUser } from '../auth/authenticateUser.ts';
// import { authorizeRole } from '../auth/authorizeRole'; // Assuming such middleware exists
import {
  getReportedMessages,
  resolveReportedMessage,
  getValidationRules,
  updateValidationRule
} from '../controllers/chatModerationController.ts';

const router = Router();

// Apply auth and ideally admin role check
router.use(authenticateUser);

router.get('/messages/reported', getReportedMessages);
router.post('/messages/:messageId/resolve', resolveReportedMessage);

router.get('/rules', getValidationRules);
router.patch('/rules/:ruleId', updateValidationRule);

export default router;