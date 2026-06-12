import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.ts';
import redis from '../config/redis.ts';
import { supabaseAdmin } from '../lib/supabaseAdmin.ts';
import { authenticateUser } from '../auth/authenticateUser.ts';
import { generateRefreshToken } from '../utils/jwt.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_access_token_secret';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  domain: process.env.NODE_ENV === 'production' ? '.mentivo.in' : undefined,
};

const sendAuthResponse = (res: any, req: any, statusCode: number, data: any) => {
  const isMobile = req.headers['x-client-type'] === 'mobile';
  const { accessToken, refreshToken, user, message } = data;

  if (isMobile) {
    return res.status(statusCode).json({ accessToken, refreshToken, user, message });
  } else {
    if (accessToken) res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 1 * 24 * 60 * 60 * 1000 }); // 1 day
    if (refreshToken) res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 60 * 24 * 60 * 60 * 1000 }); // 60 days
    return res.status(statusCode).json({ user, message });
  }
};

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

// Setup password using token from email invitation
router.post('/setup-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required.' });
  }

  try {
    const dataStr = await redis.get(`partner_invite:${token}`);
    if (!dataStr) {
      return res.status(400).json({ error: 'Invalid or expired setup link.' });
    }

    const { userId } = JSON.parse(dataStr);

    // Update password in Supabase
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password
    });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    // Remove token from Redis
    await redis.del(`partner_invite:${token}`);

    res.json({ message: 'Password configured successfully. You can now log in.' });
  } catch (err: any) {
    console.error('Setup password error:', err);
    res.status(500).json({ error: 'Failed to configure password.' });
  }
});

// Partner Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Authenticate with Supabase Auth
    const { data: sbData, error: sbError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (sbError) {
      return res.status(401).json({ error: sbError.message });
    }

    if (!sbData.user) {
      return res.status(401).json({ error: 'Authentication failed.' });
    }

    // Verify user role in our DB is a partner
    const user = await prisma.user.findUnique({
      where: { id: sbData.user.id },
      include: { partnerBalance: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Account not found in local database.' });
    }

    const partnerRoles = ['coaching_partner', 'telegram_partner', 'other_partner'];
    if (!partnerRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied. Account is not a registered partner.' });
    }

    // Generate tokens
    const payload = {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    // Access token valid for 1 day for partners
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
    const refreshToken = await generateRefreshToken(payload);

    return sendAuthResponse(res, req, 200, { accessToken, refreshToken, user });
  } catch (err: any) {
    console.error('Partner login error:', err);
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
