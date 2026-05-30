import { Router } from 'express';
import redis from '../config/redis.ts';
import resend from '../services/resend.ts';
import { generateOTP } from '../utils/otp.ts';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.ts';
import { authenticateAdmin } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as const,
  path: '/',
  domain: process.env.NODE_ENV === 'production' ? '.mentivo.in' : undefined,
};

const sendAuthResponse = (res: any, req: any, statusCode: number, data: any) => {
  const isMobile = req.headers['x-client-type'] === 'mobile';
  const { accessToken, refreshToken, ...rest } = data;

  if (isMobile) {
    return res.status(statusCode).json({ accessToken, refreshToken, ...rest });
  } else {
    if (accessToken) res.cookie('admin_accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    if (refreshToken) res.cookie('admin_refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.status(statusCode).json(rest);
  }
};

router.post('/logout', (req, res) => {
  res.clearCookie('admin_accessToken', COOKIE_OPTIONS);
  res.clearCookie('admin_refreshToken', COOKIE_OPTIONS);
  res.json({ message: 'Logged out successfully.' });
});

router.post('/request-otp', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.endsWith('@mentivo.in')) {
    return res.status(403).json({ error: 'Access restricted to @mentivo.in emails.' });
  }

  const otp = generateOTP();
  await redis.setex(`admin_otp:${email}`, 600, otp); // 10 minutes expiry

  try {
    await resend.emails.send({
      from: 'Mentivo Admin <admin@mentivo.in>',
      to: email,
      subject: 'Your Admin Dashboard OTP',
      text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
    });
    res.json({ message: 'OTP sent successfully.' });
  } catch (err: any) {
    console.error('Resend Error:', err);
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  const storedOtp = await redis.get(`admin_otp:${email}`);

  if (!storedOtp || storedOtp !== otp) {
    return res.status(401).json({ error: 'Invalid or expired OTP.' });
  }

  await redis.del(`admin_otp:${email}`);

  const accessToken = generateAccessToken(email);
  const refreshToken = generateRefreshToken(email);

  return sendAuthResponse(res, req, 200, { accessToken, refreshToken, email });
});

router.post('/refresh', async (req, res) => {
    // Basic refresh token implementation
    let oldToken = req.body.refreshToken;
    if (!oldToken && req.cookies && req.cookies.admin_refreshToken) {
      oldToken = req.cookies.admin_refreshToken;
    }

    if(!oldToken) return res.status(400).json({error: 'Refresh token required'});
    
    try {
        const { verifyRefreshToken } = await import('../utils/jwt.ts');
        const decoded = verifyRefreshToken(oldToken);
        const newAccessToken = generateAccessToken(decoded.email);
        const newRefreshToken = generateRefreshToken(decoded.email);

        return sendAuthResponse(res, req, 200, { accessToken: newAccessToken, refreshToken: newRefreshToken, email: decoded.email });
    } catch (err) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// Get current admin profile
router.get('/me', authenticateAdmin, async (req: AuthRequest, res) => {
  const email = req.user?.email;
  if (!email) return res.status(401).json({ error: 'Unauthorized' });

  // Admins are not stored in the User table; we rely on the decoded JWT email.
  res.json({ email, name: null });
});

export default router;