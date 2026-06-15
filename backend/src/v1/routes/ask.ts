import { Router } from 'express';
import { authenticateUser } from '../auth/authenticateUser.ts';
import {
  getAskConfig,
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  createAnswer,
  voteAnswer,
  getQuestionDetail,
} from '../controllers/askController.ts';

const router = Router();

router.use(authenticateUser);

router.get('/config', getAskConfig);
router.post('/questions', createQuestion);
router.get('/questions', getQuestions);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

router.post('/questions/:id/answers', createAnswer);
router.post('/answers/:id/vote', voteAnswer);
router.get('/questions/:id', getQuestionDetail);

export default router;
