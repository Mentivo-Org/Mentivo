import { Router } from 'express';
import prisma from '../config/db.ts';
import { authenticateAdmin } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import supabase from '../services/supabase.ts';
import admin from '../config/firebase.ts';

const router = Router();

router.use(authenticateAdmin);

// List all mentors
router.get('/', async (req, res) => {
  const { search } = req.query;

  const where: any = {};

  if (search) {
    where.user = {
      OR: [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ],
    };
  }

  const mentors = await prisma.mentorProfile.findMany({
    where,
    include: { user: true },
    orderBy: { user: { created_at: 'desc' } },
  });

  res.json(mentors);
});

// List unverified mentors
router.get('/unverified', async (req, res) => {
  const unverifiedMentors = await prisma.mentorProfile.findMany({
    where: { verified: false },
    include: { user: true },
  });

  res.json(unverifiedMentors);
});

// Get all promotion conditions
router.get('/promotion-conditions', async (req, res) => {
  const conditions = await prisma.mentorPromotionCondition.findMany({
    orderBy: { level: 'asc' },
  });
  res.json(conditions);
});

// Update or create promotion condition
router.put('/promotion-conditions', async (req, res) => {
  const { level, minCalls, minRating } = req.body;

  const condition = await prisma.mentorPromotionCondition.upsert({
    where: { level },
    update: { minCalls, minRating },
    create: { level, minCalls, minRating },
  });

  res.json(condition);
});

// List mentors eligible for Fellow level
router.get('/eligible-fellows', async (req, res) => {
  const fellowCondition = await prisma.mentorPromotionCondition.findUnique({
    where: { level: 'Fellow' },
  });

  if (!fellowCondition) {
    return res.status(404).json({ error: 'Fellow promotion condition not set' });
  }

  const eligibleMentors = await prisma.mentorProfile.findMany({
    where: {
      mentorlevel: { not: 'Fellow' },
      total_calls: { gte: fellowCondition.minCalls },
      avg_rating: { gte: fellowCondition.minRating },
    },
    include: { user: true },
  });

  res.json(eligibleMentors);
});

// Get mentor document (proxied/streamed via backend)
router.get('/:id/document', async (req, res) => {
    const { id } = req.params;
    const mentor = await prisma.mentorProfile.findUnique({ where: { mentorId: id } });

    if (!mentor || !mentor.id_doc_url) {
        return res.status(404).json({ error: 'Document not found' });
    }

    try {
        if (mentor.id_doc_url.startsWith('http')) {
            const response = await fetch(mentor.id_doc_url);
            if (!response.ok) return res.status(500).json({ error: 'Failed to fetch external document' });
            res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
            const arrayBuffer = await response.arrayBuffer();
            return res.send(Buffer.from(arrayBuffer));
        }

        const { data, error } = await supabase.storage
            .from('mentor-docs')
            .download(mentor.id_doc_url);

        if (error || !data) {
            console.error('Supabase download error:', error);
            return res.status(500).json({ error: 'Failed to fetch document from storage' });
        }

        const buffer = Buffer.from(await data.arrayBuffer());
        res.setHeader('Content-Type', data.type);
        res.send(buffer);
    } catch (err) {
        console.error('Document fetch error:', err);
        res.status(500).json({ error: 'Internal server error while fetching document' });
    }
});

// Verify mentor
router.post('/:id/verify', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const adminEmail = req.user?.email;

  const updatedMentor = await prisma.mentorProfile.update({
    where: { mentorId: id },
    data: {
      verified: true,
      verified_by: adminEmail,
      verified_at: new Date(),
    },
  });

  res.json(updatedMentor);
});

// Manually promote mentor to Fellow
router.post('/:id/promote-fellow', async (req, res) => {
  const { id } = req.params;

  const updatedMentor = await prisma.mentorProfile.update({
    where: { mentorId: id },
    data: { mentorlevel: 'Fellow' },
  });

  res.json(updatedMentor);
});

// General update for mentor (strips 'verified' fields)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { iit_name, branch, year, bio, expertise, rate_per_min } = req.body;
    
    const updatedMentor = await prisma.mentorProfile.update({
        where: { mentorId: id },
        data: { iit_name, branch, year, bio, expertise, rate_per_min }
    });
    
    res.json(updatedMentor);
});

// Delete mentor — removes from both Firebase Auth and Prisma DB
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });

  // 1. Delete from Firebase Auth
  if (user?.email) {
    try {
      const firebaseUser = await admin.auth().getUserByEmail(user.email);
      await admin.auth().deleteUser(firebaseUser.uid);
      console.log(`[Admin] Deleted Firebase Auth user: ${user.email}`);
    } catch (authErr: any) {
      if (authErr.code !== 'auth/user-not-found') {
        console.error(`[Admin] Failed to delete Firebase Auth for ${user.email}:`, authErr.message);
      }
    }
  }

  // 2. Delete from database (mentorProfile cascade-deletes with user)
  await prisma.user.delete({ where: { id } });

  res.json({ message: 'Mentor deleted successfully.' });
});

export default router;