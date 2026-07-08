import { Router } from 'express';
import type { Response } from 'express';
import { authenticateAdmin } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import prisma from '../config/db.ts';
import resend from '../services/resend.ts';

const router = Router();
router.use(authenticateAdmin);

// Search for students by email or phone to grant/revoke voucher eligibility
router.get('/search', async (req: AuthRequest, res: Response) => {
  const query = req.query.q as string;
  
  if (!query || query.length < 3) {
    return res.status(400).json({ error: 'Search query must be at least 3 characters' });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'student',
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        voucherEligible: true,
        voucherSubscriptions: {
          orderBy: { purchasedAt: 'desc' }
        }
      },
      take: 20
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users for vouchers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set voucher eligibility
router.post('/set-eligible', async (req: AuthRequest, res: Response) => {
  const { userId, eligible } = req.body;
  
  if (!userId || typeof eligible !== 'boolean') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId, role: 'student' },
      data: { voucherEligible: eligible }
    });

    res.json({ success: true, eligible: user.voucherEligible });
  } catch (error) {
    console.error('Error setting voucher eligibility:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send invite email
router.post('/send-invite', async (req: AuthRequest, res: Response) => {
  const { userId } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId, role: 'student' }
    });

    if (!user || !user.email) {
      return res.status(400).json({ error: 'User not found or has no email' });
    }

    if (!user.voucherEligible) {
      // Auto-set eligibility if sending an invite
      await prisma.user.update({
        where: { id: userId },
        data: { voucherEligible: true }
      });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0077CB;">Exclusive Voucher Offer!</h2>
        <p>Hi ${user.name || 'Student'},</p>
        <p>You have been specially selected for our Mentivo Voucher program!</p>
        <p>Purchase a <strong>₹3,000</strong> or <strong>₹6,000</strong> plan and get an extra <strong>10%</strong> in session credits automatically distributed over 6 months.</p>
        <p>To claim this offer and purchase your voucher, log in to your account:</p>
        <a href="https://www.mentivo.in/login?redirect=/student/home" style="display: inline-block; padding: 12px 24px; background-color: #0077CB; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">Log In & View Offer</a>
        <p style="margin-top: 32px; font-size: 12px; color: #666;">If you have any questions, feel free to reply to this email or contact support.</p>
      </div>
    `;

    await resend.emails.send({
      from: 'Mentivo <no-reply@mentivo.in>',
      to: user.email,
      subject: 'Your Exclusive Mentivo Voucher Offer 🚀',
      html: htmlContent
    });

    console.log(`[Admin] Sent voucher invite email to ${user.email}`);

    res.json({ success: true, message: 'Invite sent' });
  } catch (error) {
    console.error('Error sending voucher invite:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
