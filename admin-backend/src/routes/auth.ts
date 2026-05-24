import { Router } from 'express';
import redis from '../config/redis';
import resend from '../services/resend';
import prisma from '../config/db';
import { generateOTP } from '../utils/otp';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

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

  res.json({ accessToken, refreshToken });
});

router.post('/refresh', async (req, res) => {
    // Basic refresh token implementation
    const { refreshToken } = req.body;
    if(!refreshToken) return res.status(400).json({error: 'Refresh token required'});
    
    // In a real scenario, we'd verify the refresh token against a database or whitelist
    // For now, we'll just check if it's valid
    try {
        const { verifyRefreshToken } = require('../utils/jwt');
        const decoded = verifyRefreshToken(refreshToken);
        const newAccessToken = generateAccessToken(decoded.email);
        res.json({ accessToken: newAccessToken });
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