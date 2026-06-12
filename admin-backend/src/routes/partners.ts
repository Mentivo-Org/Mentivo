import { Router } from 'express';
import prisma from '../config/db.ts';
import redis from '../config/redis.ts';
import supabase from '../services/supabase.ts';
import resend from '../services/resend.ts';
import { authenticateAdmin } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Protect all routes
router.use(authenticateAdmin);

// Create a partner account and send invitation email
router.post('/create', async (req: AuthRequest, res) => {
  const { 
    email, 
    name, 
    phone, 
    role, 
    commissionMethod, 
    commissionValue, 
    referralCode, 
    coachingCenterId 
  } = req.body;
  const adminEmail = req.user?.email;

  if (!email || !name || !role || !referralCode) {
    return res.status(400).json({ error: 'Email, name, role, and referralCode are required.' });
  }

  const allowedRoles = ['coaching_partner', 'telegram_partner', 'other_partner'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}` });
  }

  try {
    // Check if user email exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { referralCode }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'A user with this email already exists.' });
      }
      if (existingUser.referralCode === referralCode) {
        return res.status(400).json({ error: 'This referral code is already in use.' });
      }
    }

    // Generate a secure temp password
    const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + 'A1!';

    // Create user in Supabase Auth
    const { data: sbData, error: sbError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (sbError) {
      return res.status(400).json({ error: sbError.message });
    }

    // Create user in DB
    const partner = await prisma.user.create({
      data: {
        id: sbData.user.id,
        email,
        name,
        phone: phone || null,
        role: role as any,
        referralCode,
        commissionMethod: commissionMethod || null,
        commissionValue: commissionValue ? Number(commissionValue) : null,
        coachingCenterId: coachingCenterId || null,
        createdBy: adminEmail,
        isEmailVerified: true,
        partnerBalance: {
          create: {}
        }
      }
    });

    // Generate invitation token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store in Redis (expires in 24 hours)
    await redis.setex(`partner_invite:${token}`, 24 * 60 * 60, JSON.stringify({ email, userId: partner.id }));

    // Send email using Resend
    const inviteLink = `https://mentivo.in/setup-password?token=${token}`;
    
    await resend.emails.send({
      from: 'Mentivo Admin <admin@mentivo.in>',
      to: email,
      subject: 'Welcome to Mentivo Partner Program - Complete Your Registration',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 16px;">
          <h2 style="color: #00288e; margin-bottom: 16px;">Welcome to Mentivo, ${name}!</h2>
          <p>You have been registered as a <strong>${role.replace('_', ' ')}</strong> on the Mentivo Partner platform.</p>
          <p>Please click the button below to set up your password and access your dashboard. This invitation link is valid for <strong>24 hours</strong> only.</p>
          <div style="margin: 24px 0;">
            <a href="${inviteLink}" style="background-color: #00288e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Set Up Your Password</a>
          </div>
          <p style="font-size: 12px; color: #64748b;">If you cannot click the button, copy and paste this link in your browser: <br/> ${inviteLink}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">Mentivo Admin Team</p>
        </div>
      `
    });

    res.status(201).json({ success: true, partner: { id: partner.id, email: partner.email, referralCode: partner.referralCode } });
  } catch (err: any) {
    console.error('Error creating partner:', err);
    res.status(500).json({ error: 'Failed to create partner account.' });
  }
});

// List partners
router.get('/list', async (req, res) => {
  try {
    const partners = await prisma.user.findMany({
      where: {
        role: {
          in: ['coaching_partner', 'telegram_partner', 'other_partner']
        }
      },
      include: {
        partnerBalance: true,
        coachingCenter: true,
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(partners);
  } catch (err: any) {
    console.error('Error listing partners:', err);
    res.status(500).json({ error: 'Failed to retrieve partners list.' });
  }
});

// Update commission settings
router.put('/:id/commission', async (req, res) => {
  const { id } = req.params;
  const { commissionMethod, commissionValue } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        commissionMethod,
        commissionValue: commissionValue ? Number(commissionValue) : null
      }
    });

    res.json({ success: true, partner: updated });
  } catch (err: any) {
    console.error('Error updating commission:', err);
    res.status(500).json({ error: 'Failed to update commission settings.' });
  }
});

// List coaching centers for selection
router.get('/coaching-centers', async (req, res) => {
  try {
    const centers = await prisma.coachingCenter.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(centers);
  } catch (err: any) {
    console.error('Error listing centers:', err);
    res.status(500).json({ error: 'Failed to list coaching centers' });
  }
});

export default router;
