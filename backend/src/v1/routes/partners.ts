import { Router } from 'express';
import prisma from '../config/db.ts';
import redis from '../config/redis.ts';
import { supabaseAdmin } from '../lib/supabaseAdmin.ts';
import { authenticateUser } from '../auth/authenticateUser.ts';
const router = Router();

// Validate referral code (public route used during signup)
router.post('/validate', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Referral code is required.' });
  }

  try {
    const partner = await prisma.user.findFirst({
      where: {
        referralCode: code,
        role: {
          in: ['coaching_partner', 'telegram_partner', 'other_partner']
        }
      }
    });

    if (!partner) {
      return res.status(400).json({ valid: false, error: 'Invalid referral code.' });
    }

    res.json({ valid: true, partner: { name: partner.name, role: partner.role } });
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Setup password - DEPRECATED: Partners now authenticate via email OTP
router.post('/setup-password', async (req, res) => {
  const { token } = req.body;

  // Clean up any old Redis key if token provided
  if (token) {
    try {
      await redis.del(`partner_invite:${token}`);
    } catch (_) {}
  }

  return res.status(200).json({
    message: 'Password setup is no longer required. Please log in at mentivo.in/login using a one-time code sent to your email.',
  });
});

// Partner Login - Request OTP
router.post('/login', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const partnerRoles = ['coaching_partner', 'telegram_partner', 'other_partner'];
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: 'No partner account found with this email.' });
    }

    if (!partnerRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied. Account is not a registered partner.' });
    }

    const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (otpError) {
      return res.status(500).json({ error: 'Failed to send OTP: ' + otpError.message });
    }

    return res.status(200).json({
      message: 'OTP sent to your email. Please check your inbox.',
      email,
      serverTime: Date.now(),
    });
  } catch (err: any) {
    console.error('Partner login OTP error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Partner self stats
router.get('/me', authenticateUser, async (req: any, res) => {
  const partner = req.user;

  try {
    const stats: any = {};

    // Get referrals
    const referrals = await prisma.user.findMany({
      where: { referredByReferralCode: partner.referralCode },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
        callSessionsStudent: {
          where: { status: 'settled' },
          select: { amountCharged: true }
        }
      }
    });

    const totalSignups = referrals.length;
    let totalRevenueGenerated = 0;

    referrals.forEach(ref => {
      ref.callSessionsStudent.forEach(session => {
        totalRevenueGenerated += Number(session.amountCharged);
      });
    });

    stats.totalSignups = totalSignups;
    stats.totalRevenueGenerated = totalRevenueGenerated;

    if (partner.role === 'coaching_partner' && partner.coachingCenterId) {
      const center = await prisma.coachingCenter.findUnique({
        where: { id: partner.coachingCenterId },
        include: { balance: true }
      });
      stats.coachingCenter = center;
    }

    // Get partner balance details
    const balance = await prisma.partnerBalance.findUnique({
      where: { partnerId: partner.id }
    });

    res.json({
      partner: {
        id: partner.id,
        email: partner.email,
        name: partner.name,
        role: partner.role,
        referralCode: partner.referralCode,
        commissionMethod: partner.commissionMethod,
        commissionValue: partner.commissionValue,
      },
      balance,
      stats
    });
  } catch (err: any) {
    console.error('Partner stats error:', err);
    res.status(500).json({ error: 'Failed to fetch partner information.' });
  }
});

// Telegram leaderboard
router.get('/leaderboard', authenticateUser, async (req: any, res) => {
  const user = req.user;
  const { period } = req.query; // 'weekly' or 'monthly' (default: 'weekly')

  if (user.role !== 'telegram_partner') {
    return res.status(403).json({ error: 'Access denied. Telegram leaderboard is restricted to telegram partners.' });
  }

  const daysLimit = period === 'monthly' ? 30 : 7;
  const sinceDate = new Date(Date.now() - daysLimit * 24 * 60 * 60 * 1000);

  try {
    const telegramPartners = await prisma.user.findMany({
      where: { role: 'telegram_partner' },
      select: {
        id: true,
        name: true,
        referralCode: true,
      }
    });

    const leaderboard = await Promise.all(telegramPartners.map(async (partner) => {
      const signupCount = await prisma.user.count({
        where: {
          referredByReferralCode: partner.referralCode,
          created_at: { gte: sinceDate }
        }
      });

      // Mask other partners' names for privacy
      const isSelf = partner.id === user.id;
      const displayName = isSelf 
        ? partner.name 
        : partner.name 
          ? `${partner.name.substring(0, 3)}***` 
          : 'Telegram Admin';

      return {
        id: partner.id,
        name: displayName,
        signupCount,
        isSelf
      };
    }));

    // Sort descending
    leaderboard.sort((a, b) => b.signupCount - a.signupCount);

    res.json(leaderboard);
  } catch (err: any) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to retrieve leaderboard.' });
  }
});

export default router;
