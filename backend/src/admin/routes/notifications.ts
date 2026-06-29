import { Router } from 'express';
import prisma from '../config/db.ts';
import { sendPushNotification } from '../services/notifications.ts';
import { authenticateAdmin } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { Prisma } from '@prisma/client';

const router = Router();

router.use(authenticateAdmin);

// Search users by email (for autocomplete)
router.get('/search-users', async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') return res.json([]);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: 10,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  res.json(users);
});

// Helper to build filters
const buildUserFilter = (filters: any): Prisma.UserWhereInput => {
    const where: Prisma.UserWhereInput = {};
    if (filters.role) where.role = filters.role;
    if (filters.grade) where.grade = filters.grade;
    if (filters.verified !== undefined) {
        where.mentorProfile = { verificationStatus: filters.verified ? 'VERIFIED' : 'PENDING' };
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

// Send notification to a single user
router.post('/send', async (req: AuthRequest, res) => {
  const { toId, title, body, priority } = req.body;
  const adminEmail = req.user?.email;

  if (!toId || !title || !body || !adminEmail) {
    return res.status(400).json({ error: 'Recipient ID, title, and body are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: toId },
      include: { fcmTokens: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1. Create In-App Notification
    await prisma.notification.create({
      data: {
        userId: toId,
        title,
        body,
      }
    });

    // 2. Log to DB
    await prisma.notificationLog.create({
      data: {
        sender: adminEmail,
        received_by_id: [toId],
        title,
        body,
      }
    });

    // 3. Send Push Notification
    const tokens = user.fcmTokens.map(t => t.token);
    if (tokens.length > 0) {
      await sendPushNotification(tokens, title, body, priority || 'normal');
    }

    res.json({ message: 'Notification sent successfully.' });
  } catch (err: any) {
    console.error('Notification Error:', err);
    res.status(500).json({ error: 'Failed to send notification.' });
  }
});

// Send notification to a batch of users
router.post('/send-batch', async (req: AuthRequest, res) => {
  const { userIds, title, body, priority } = req.body;
  const adminEmail = req.user?.email;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !title || !body || !adminEmail) {
    return res.status(400).json({ error: 'User IDs list, title, and body are required.' });
  }

  try {
    // 1. Create In-App Notifications in bulk
    await prisma.notification.createMany({
      data: userIds.map(id => ({
        userId: id,
        title,
        body,
      }))
    });

    // 2. Log to DB
    await prisma.notificationLog.create({
      data: {
        sender: adminEmail,
        received_by_id: userIds,
        title,
        body,
      }
    });

    // 3. Send Push Notifications
    const usersWithTokens = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { fcmTokens: true }
    });

    const allTokens = usersWithTokens.flatMap(u => u.fcmTokens.map(t => t.token));
    
    if (allTokens.length > 0) {
      // Firebase Multicast has a limit of 500 tokens per call
      const batchSize = 500;
      for (let i = 0; i < allTokens.length; i += batchSize) {
        const batch = allTokens.slice(i, i + batchSize);
        await sendPushNotification(batch, title, body, priority || 'normal');
      }
    }

    res.json({ message: `Notifications sent to ${userIds.length} users.` });
  } catch (err: any) {
    console.error('Notification Batch Error:', err);
    res.status(500).json({ error: 'Failed to send batch notifications.' });
  }
});

// Send notification to a group based on filters
router.post('/send-group', async (req: AuthRequest, res) => {
  const { filters, title, body, priority } = req.body;
  const adminEmail = req.user?.email;

  if (!title || !body || !adminEmail) {
    return res.status(400).json({ error: 'Title and body are required.' });
  }

  try {
    const users = await prisma.user.findMany({
      where: buildUserFilter(filters),
      select: { id: true }
    });

    const userIds = users.map(u => u.id);

    if (userIds.length === 0) {
      return res.status(400).json({ error: 'No users match the selected filters.' });
    }

    // Reuse send-batch logic (or internal function)
    // 1. In-App Notifications
    await prisma.notification.createMany({
      data: userIds.map(id => ({
        userId: id,
        title,
        body,
      }))
    });

    // 2. Log to DB
    await prisma.notificationLog.create({
      data: {
        sender: adminEmail,
        received_by_id: userIds,
        title,
        body,
      }
    });

    // 3. Push Notifications
    const usersWithTokens = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { fcmTokens: true }
    });

    const allTokens = usersWithTokens.flatMap(u => u.fcmTokens.map(t => t.token));
    
    if (allTokens.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < allTokens.length; i += batchSize) {
        const batch = allTokens.slice(i, i + batchSize);
        await sendPushNotification(batch, title, body, priority || 'normal');
      }
    }

    res.json({ message: `Notifications sent to ${userIds.length} users.` });
  } catch (err: any) {
    console.error('Notification Group Error:', err);
    res.status(500).json({ error: 'Failed to send group notifications.' });
  }
});

export default router;
