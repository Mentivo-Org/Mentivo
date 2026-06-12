import { Router } from 'express';
import prisma from '../config/db.ts';
import { authenticateAdmin } from '../middleware/auth.ts';

const router = Router();

// Protect all configuration routes
router.use(authenticateAdmin);

// GET /api/config/ask
router.get('/ask', async (req, res) => {
  try {
    let config = await prisma.askConfig.findUnique({
      where: { id: 'default' },
    });
    if (!config) {
      config = await prisma.askConfig.create({
        data: {
          id: 'default',
          maxQuestionsPerPeriod: 5,
          periodHours: 24,
          maxQuestionWords: null,
        },
      });
    }
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/config/ask
router.post('/ask', async (req, res) => {
  const { maxQuestionsPerPeriod, periodHours, maxQuestionWords } = req.body;
  try {
    const config = await prisma.askConfig.upsert({
      where: { id: 'default' },
      update: {
        maxQuestionsPerPeriod: Number(maxQuestionsPerPeriod),
        periodHours: Number(periodHours),
        maxQuestionWords: maxQuestionWords !== undefined && maxQuestionWords !== null && maxQuestionWords !== '' ? Number(maxQuestionWords) : null,
      },
      create: {
        id: 'default',
        maxQuestionsPerPeriod: Number(maxQuestionsPerPeriod),
        periodHours: Number(periodHours),
        maxQuestionWords: maxQuestionWords !== undefined && maxQuestionWords !== null && maxQuestionWords !== '' ? Number(maxQuestionWords) : null,
      },
    });
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
