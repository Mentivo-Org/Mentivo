import { Router } from 'express';
import prisma from '../config/db.ts';
import { authenticateAdmin } from '../middleware/auth.ts';
import supabase from '../services/supabase.ts';

const router = Router();

router.use(authenticateAdmin);

// Fetch profiles (initially empty, requires search term)
router.get('/profiles', async (req, res) => {
  const { role, search } = req.query;

  if (role !== 'student' && role !== 'mentor') {
    return res.status(400).json({ error: "Invalid role. Must be 'student' or 'mentor'." });
  }

  if (!search) {
    return res.json([]);
  }

  const where: any = { role };

  where.OR = [
    { name: { contains: search as string, mode: 'insensitive' } },
    { email: { contains: search as string, mode: 'insensitive' } },
    { phone: { contains: search as string, mode: 'insensitive' } },
  ];

  try {
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json(users);
  } catch (error: any) {
    console.error('Error fetching deletion profiles:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Dynamic check endpoint: query in which tables information is stored for a specific user
router.get('/profile/:id/stats', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        mentorBalance: true,
        mentorProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Call sessions count
    const callsCount = await prisma.callSession.count({
      where: user.role === 'student' ? { student_id: id } : { mentor_id: id },
    });

    // Ratings count
    const ratingsCount = await prisma.rating.count({
      where: user.role === 'student' ? { studentId: id } : { mentorId: id },
    });

    // Chats messages count
    const chatMsgCount = await prisma.chatMessage.count({
      where: { senderId: id },
    });

    // Chat sessions count
    const chatSessionCount = await prisma.chatSession.count({
      where: user.role === 'student' ? { studentId: id } : { mentorId: id },
    });

    // Payouts count (mentor only)
    const payoutsCount = user.role === 'mentor'
      ? await prisma.payout.count({ where: { mentorId: id } })
      : 0;

    // Check Supabase Auth account
    let hasSupabaseAuth = false;
    try {
      const { data: authUser, error: getAuthError } = await supabase.auth.admin.getUserById(id);
      if (authUser && authUser.user && !getAuthError) {
        hasSupabaseAuth = true;
      }
    } catch (e) {}

    // Check Supabase Storage file (for mentor Verification IDs)
    let hasStorageFile = false;
    if (user.role === 'mentor' && user.mentorProfile?.id_doc_url) {
      const docUrl = user.mentorProfile.id_doc_url;
      if (docUrl && !docUrl.startsWith('http')) {
        hasStorageFile = true;
      }
    }

    // Construct response containing existing tables details
    const stats: any = {};

    stats.profile = { exists: true, count: 1, label: 'User Profile Record (Primary DB)' };

    if (hasSupabaseAuth) {
      stats.auth = { exists: true, count: 1, label: 'Supabase Authentication Account' };
    }

    if (hasStorageFile) {
      stats.storage = { exists: true, count: 1, label: 'Supabase Storage Identification File' };
    }

    const hasCalls = callsCount > 0;

    if (user.role === 'student' && user.wallet) {
      const transCount = await prisma.walletTransaction.count({ where: { userId: id } });
      stats.wallet = { 
        exists: !hasCalls, 
        count: transCount + 1, 
        label: `Wallet & Transactions (${transCount + 1})${hasCalls ? ' [PRESERVED]' : ''}` 
      };
    } else if (user.role === 'mentor' && user.mentorBalance) {
      stats.wallet = { 
        exists: !hasCalls, 
        count: 1, 
        label: `Mentor Payout Balance Account (1)${hasCalls ? ' [PRESERVED]' : ''}` 
      };
    }

    if (callsCount > 0) {
      stats.calls = { exists: false, count: callsCount, label: `Call Sessions (${callsCount}) [PRESERVED]` };
    }

    if (ratingsCount > 0) {
      stats.ratings = { exists: true, count: ratingsCount, label: `Ratings (${ratingsCount})` };
    }

    if (chatMsgCount > 0 || chatSessionCount > 0) {
      stats.chats = { exists: true, count: chatMsgCount + chatSessionCount, label: `Chats - ${chatMsgCount} messages, ${chatSessionCount} sessions` };
    }

    if (payoutsCount > 0) {
      stats.payouts = { exists: true, count: payoutsCount, label: `Payouts History (${payoutsCount})` };
    }

    res.json({
      role: user.role,
      name: user.name,
      email: user.email,
      stats
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Selective delete endpoint for specific user
router.post('/delete', async (req, res) => {
  const { id, role, options } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  if (role !== 'student' && role !== 'mentor') {
    return res.status(400).json({ error: "Invalid role. Must be 'student' or 'mentor'." });
  }

  const opts = options || {};

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { mentorProfile: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found in system.' });
    }

    // 1. Delete Storage Document
    if (opts.storage && role === 'mentor' && user.mentorProfile?.id_doc_url) {
      const docUrl = user.mentorProfile.id_doc_url;
      if (!docUrl.startsWith('http')) {
        try {
          await supabase.storage.from('mentor-docs').remove([docUrl]);
          console.log(`Deleted document ${docUrl} from Supabase storage.`);
        } catch (err) {
          console.error('Failed to remove document from Supabase storage:', err);
        }
      }
    }

    // 2. Delete Supabase Authentication
    if (opts.auth) {
      try {
        const { error: authErr } = await supabase.auth.admin.deleteUser(id);
        if (authErr) {
          console.error(`Failed to delete Supabase auth user ${id}:`, authErr.message);
        } else {
          console.log(`Deleted Supabase Auth user for ID: ${id}`);
        }
      } catch (authErr: any) {
        console.error(`Failed to delete Supabase authentication for ${id}:`, authErr);
      }
    }

    // 3. Delete Database Tables via Prisma Transaction
    await prisma.$transaction(async (tx) => {
      // Chats
      if (opts.chats) {
        await tx.chatMessage.deleteMany({ where: { senderId: id } });
        if (role === 'student') {
          await tx.chatSession.deleteMany({ where: { studentId: id } });
        } else {
          await tx.chatSession.deleteMany({ where: { mentorId: id } });
        }
      }

      // Ratings
      if (opts.ratings) {
        if (role === 'student') {
          await tx.rating.deleteMany({ where: { studentId: id } });
        } else {
          await tx.rating.deleteMany({ where: { mentorId: id } });
        }
      }

      // Call sessions are preserved for audit purposes and cannot be deleted.

      // Wallet / Transactions
      if (opts.wallet) {
        const callsCount = await tx.callSession.count({
          where: role === 'student' ? { student_id: id } : { mentor_id: id },
        });
        if (callsCount > 0) {
          throw new Error('Wallet and transaction logs cannot be deleted because call records exist and must be preserved.');
        }

        if (role === 'student') {
          await tx.wallet.deleteMany({ where: { userId: id } });
          await tx.walletTransaction.deleteMany({ where: { userId: id } });
        } else {
          await tx.mentorBalance.deleteMany({ where: { mentorId: id } });
        }
      }

      // Payout logs
      if (opts.payouts && role === 'mentor') {
        await tx.payout.deleteMany({ where: { mentorId: id } });
      }

      // Core system sessions, tokens, and notifications (always clean up if user profile is being removed)
      if (opts.profile) {
        const callsCount = await tx.callSession.count({
          where: role === 'student' ? { student_id: id } : { mentor_id: id },
        });

        await tx.fCMToken.deleteMany({ where: { userId: id } });
        await tx.refreshToken.deleteMany({ where: { userId: id } });
        await tx.notification.deleteMany({ where: { userId: id } });

        if (role === 'mentor') {
          await tx.mentorProfile.deleteMany({ where: { mentorId: id } });
        }

        if (callsCount > 0) {
          // Anonymize User record instead of deleting it to preserve Call and Wallet table constraints
          await tx.user.update({
            where: { id },
            data: {
              name: 'Deleted User',
              email: `deleted-${id}@deleted.mentivo.in`,
              phone: null,
              referralCode: null,
              referredByReferralCode: null,
            }
          });
          console.log(`Anonymized User profile for user ID: ${id}`);
        } else {
          // If no call logs exist, execute full cascade deletion of wallet and user records
          if (role === 'student') {
            await tx.wallet.deleteMany({ where: { userId: id } });
            await tx.walletTransaction.deleteMany({ where: { userId: id } });
          } else {
            await tx.mentorBalance.deleteMany({ where: { mentorId: id } });
          }
          await tx.user.delete({ where: { id } });
          console.log(`Fully deleted User profile for user ID: ${id}`);
        }
      }
    });

    await prisma.logEntry.create({
        data: {
            level: 'WARN',
            source: 'admin-backend',
            message: `Admin triggered selective deletion for user ID: ${id}`,
            metadata: { 
              adminEmail: req.user?.email || 'Unknown', 
              targetUserId: id, 
              targetRole: role, 
              options: opts 
            }
        }
    }).catch(() => {});

    res.json({ message: 'Selected records deleted successfully.' });
  } catch (error: any) {
    console.error('Error executing selective profile deletion:', error);
    await prisma.logEntry.create({
        data: {
            level: 'ERROR',
            source: 'admin-backend',
            message: `Admin selective deletion failed for user ID: ${id} - ${error.message}`,
            metadata: { adminEmail: req.user?.email || 'Unknown', error: error.stack }
        }
    }).catch(() => {});
    res.status(500).json({ error: error.message || 'Failed to execute selective deletion.' });
  }
});

export default router;
