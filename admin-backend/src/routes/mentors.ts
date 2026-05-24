import { Router } from 'express';
import prisma from '../config/db';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import supabase from '../services/supabase';

const router = Router();

router.use(authenticateAdmin);

// List unverified mentors
router.get('/unverified', async (req, res) => {
  const unverifiedMentors = await prisma.mentorProfile.findMany({
    where: { verified: false },
    include: { user: true },
  });

  // No longer generating signed URLs here to prevent exposing them in the JSON response
  res.json(unverifiedMentors);
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

// General update for mentor (strips 'verified' fields)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { iit_name, branch, year, bio, expertise, rate_per_min } = req.body;
    
    // Explicitly exclude verification fields
    const updatedMentor = await prisma.mentorProfile.update({
        where: { mentorId: id },
        data: { iit_name, branch, year, bio, expertise, rate_per_min }
    });
    
    res.json(updatedMentor);
});

export default router;