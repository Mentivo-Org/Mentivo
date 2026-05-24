import { Router } from 'express';
import prisma from '../config/db';
import resend from '../services/resend';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';

const router = Router();

router.use(authenticateAdmin);

// Helper to get dynamic signature
const getSignature = (email: string) => {
    return `\n\n--\nMentivo Admin Team\n${email}`;
};

// Search users by email (for autocomplete)
router.get('/search-users', async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') return res.json([]);

  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: q,
        mode: 'insensitive',
      },
    },
    take: 10,
    select: {
      email: true,
      name: true,
      role: true,
    },
  });

  res.json(users);
});

// Send email to a single user
router.post('/send', async (req: AuthRequest, res) => {
  const { to, subject, body } = req.body;
  const adminEmail = req.user?.email;

  if (!to || !subject || !body || !adminEmail) {
    return res.status(400).json({ error: 'Recipient, subject, and body are required.' });
  }

  try {
    const signature = await getSignature(adminEmail);
    await resend.emails.send({
      from: 'Mentivo Admin <admin@mentivo.in>',
      to,
      subject,
      text: body + signature,
    });
    res.json({ message: 'Email sent successfully.' });
  } catch (err: any) {
    console.error('Resend Error:', err);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

// Send email to a specific list of users
router.post('/send-batch', async (req: AuthRequest, res) => {
  const { emails, subject, body } = req.body;
  const adminEmail = req.user?.email;

  if (!emails || !Array.isArray(emails) || emails.length === 0 || !subject || !body || !adminEmail) {
    return res.status(400).json({ error: 'Recipients list, subject, and body are required.' });
  }

  try {
    const signature = await getSignature(adminEmail);
    const batchSize = 50;
    for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        await resend.emails.send({
            from: 'Mentivo Admin <admin@mentivo.in>',
            to: 'admin@mentivo.in',
            bcc: batch,
            subject,
            text: body + signature,
        });
    }
    res.json({ message: `Emails sent to ${emails.length} users.` });
  } catch (err: any) {
    console.error('Resend Batch Error:', err);
    res.status(500).json({ error: 'Failed to send batch emails.' });
  }
});

// Helper to build filters
const buildUserFilter = (filters: any): Prisma.UserWhereInput => {
    const where: Prisma.UserWhereInput = {};
    if (filters.role) where.role = filters.role;
    if (filters.grade) where.grade = filters.grade;
    if (filters.verified !== undefined) {
        where.mentorProfile = { verified: filters.verified };
    }
    return where;
}

// Preview group count
router.post('/preview-group', async (req, res) => {
  const { filters } = req.body;

  const count = await prisma.user.count({
    where: buildUserFilter(filters),
  });

  res.json({ count });
});

// Send group emails
router.post('/send-group', async (req: AuthRequest, res) => {
  const { filters, subject, body } = req.body;
  const adminEmail = req.user?.email;

  if (!subject || !body || !adminEmail) {
    return res.status(400).json({ error: 'Subject and body are required.' });
  }

  const users = await prisma.user.findMany({
    where: buildUserFilter(filters),
    select: { email: true },
  });

  const emails = users.map(u => u.email).filter(Boolean) as string[];

  if (emails.length === 0) {
    return res.status(400).json({ error: 'No users match the selected filters.' });
  }

  try {
    const signature = await getSignature(adminEmail);
    const batchSize = 50;
    for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        await resend.emails.send({
            from: 'Mentivo Admin <admin@mentivo.in>',
            to: 'admin@mentivo.in', // Send to self
            bcc: batch,           // BCC recipients
            subject,
            text: body + signature,
        });
    }

    res.json({ message: `Emails sent to ${emails.length} users.` });
  } catch (err: any) {
    console.error('Resend Bulk Error:', err);
    res.status(500).json({ error: 'Failed to send bulk emails.' });
  }
});

export default router;