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
          maxQuestionChars: null,
          maxAnswerChars: null,
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
  const { maxQuestionsPerPeriod, periodHours, maxQuestionChars, maxAnswerChars } = req.body;
  try {
    const config = await prisma.askConfig.upsert({
      where: { id: 'default' },
      update: {
        maxQuestionsPerPeriod: Number(maxQuestionsPerPeriod),
        periodHours: Number(periodHours),
        maxQuestionChars: maxQuestionChars !== undefined && maxQuestionChars !== null && maxQuestionChars !== '' ? Number(maxQuestionChars) : null,
        maxAnswerChars: maxAnswerChars !== undefined && maxAnswerChars !== null && maxAnswerChars !== '' ? Number(maxAnswerChars) : null,
      },
      create: {
        id: 'default',
        maxQuestionsPerPeriod: Number(maxQuestionsPerPeriod),
        periodHours: Number(periodHours),
        maxQuestionChars: maxQuestionChars !== undefined && maxQuestionChars !== null && maxQuestionChars !== '' ? Number(maxQuestionChars) : null,
        maxAnswerChars: maxAnswerChars !== undefined && maxAnswerChars !== null && maxAnswerChars !== '' ? Number(maxAnswerChars) : null,
      },
    });
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/config/settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.appSetting.findMany();
    const configMap = settings.reduce((acc: any, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(configMap);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/config/settings
router.post('/settings', async (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ error: 'Missing required fields: key, value' });
  }

  try {
    const setting = await prisma.appSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
    res.json(setting);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/config/settings/bulk
router.post('/settings/bulk', async (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid required field: settings' });
  }

  try {
    const results = await prisma.$transaction(
      Object.entries(settings).map(([key, value]) =>
        prisma.appSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );
    res.json({ success: true, count: results.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
