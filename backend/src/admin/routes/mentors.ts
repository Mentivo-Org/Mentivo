import { Router } from 'express';
import prisma from '../config/db.ts';
import { authenticateAdmin } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import supabase from '../services/supabase.ts';
import admin from '../config/firebase.ts';
import resend from '../services/resend.ts';
import fs from 'fs';
import path from 'path';
import { triggerManualPing } from '../../v1/services/pingMentors.ts';

const router = Router();

router.use(authenticateAdmin);

// Preview top mentors matching specified criteria
router.post('/top-mentors/preview', async (req, res) => {
  try {
    const { minRating, minCalls, limit } = req.body;

    const parsedMinRating = parseFloat(minRating !== undefined ? minRating : '4.5');
    const parsedMinCalls = parseInt(minCalls !== undefined ? minCalls : '10', 10);
    const parsedLimit = parseInt(limit !== undefined ? limit : '5', 10);

    const mentors = await prisma.mentorProfile.findMany({
      where: {
        verificationStatus: 'VERIFIED',
        avg_rating: { gte: parsedMinRating },
        total_calls: { gte: parsedMinCalls }
      },
      include: {
        user: {
          select: {
            name: true,
            photo_url: true,
            email: true
          }
        }
      },
      orderBy: [
        { avg_rating: 'desc' },
        { total_calls: 'desc' }
      ],
      take: parsedLimit
    });

    res.json(mentors);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Trigger manual ping to online mentors
router.post('/manual-ping', async (req, res) => {
  try {
    // Fire and forget
    triggerManualPing().catch(err => console.error('[Admin] Manual ping error:', err));
    res.json({ success: true, message: 'Manual ping process started. Unresponsive mentors will be marked offline in 5 minutes.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

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
    where: { verificationStatus: 'PENDING' },
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
      total_calls: { gte: fellowCondition.minCalls ?? undefined },
      avg_rating: { gte: fellowCondition.minRating ?? undefined },
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
      verificationStatus: 'VERIFIED',
      verified_by: adminEmail,
      verified_at: new Date(),
      mentorlevel: "Verified"
    },
    include: {
      user: true
    }
  });

  const mentorEmail = updatedMentor.user?.email;
  const mentorName = updatedMentor.user?.name || 'Mentor';

  if (mentorEmail) {
    try {
      const pdfPath = path.join(process.cwd(), 'src/assets/mentor_guidelines.pdf');
      const attachments = [];
      if (fs.existsSync(pdfPath)) {
        attachments.push({
          filename: 'Mentivo_Mentor_Guidelines.pdf',
          content: fs.readFileSync(pdfPath)
        });
      }

      await resend.emails.send({
        from: 'Mentivo Admin <admin@mentivo.in>',
        to: mentorEmail,
        subject: 'Mentivo Mentor Verification Approved!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #0077CB; margin-bottom: 16px;">Congratulations, ${mentorName}!</h2>
            <p>We are pleased to inform you that your mentor profile on Mentivo has been verified and approved.</p>
            <p>You can now log in to the app, set your status to online, and start taking calls from JEE aspirants.</p>
            <p>We have attached the <strong>Mentivo Mentor Guidelines</strong> to this email. Please review the document carefully to understand the best practices, billing details, and platform expectations.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8;">Mentivo Admin Team</p>
          </div>
        `,
        attachments
      });
    } catch (emailErr) {
      console.error('Failed to send verification email to mentor:', emailErr);
    }
  }

  await prisma.logEntry.create({
      data: {
          level: 'INFO',
          source: 'admin-backend',
          message: `Admin approved mentor verification for ID: ${id}`,
          metadata: { adminEmail, mentorId: id }
      }
  }).catch(() => {});

  res.json(updatedMentor);
});

// Reject mentor
router.post('/:id/reject', async (req: AuthRequest, res) => {
  const { id } = req.params;
  const adminEmail = req.user?.email;

  const updatedMentor = await prisma.mentorProfile.update({
    where: { mentorId: id },
    data: {
      verificationStatus: 'REJECTED',
      verified_by: adminEmail,
      verified_at: new Date(),
      mentorlevel: null
    },
  });

  await prisma.logEntry.create({
      data: {
          level: 'INFO',
          source: 'admin-backend',
          message: `Admin rejected mentor verification for ID: ${id}`,
          metadata: { adminEmail, mentorId: id }
      }
  }).catch(() => {});

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

// General update for mentor (strips 'verified' and college fields)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, phone, branch, year, bio, expertise, rate_per_min } = req.body;
    
    if (name !== undefined || phone !== undefined) {
        await prisma.user.update({
            where: { id },
            data: { 
                ...(name !== undefined && { name }),
                ...(phone !== undefined && { phone })
            }
        });
    }
    
    const updatedMentor = await prisma.mentorProfile.update({
        where: { mentorId: id },
        data: { branch, year, bio, expertise, rate_per_min },
        include: { user: true }
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
