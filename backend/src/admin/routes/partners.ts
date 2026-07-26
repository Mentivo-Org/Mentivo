import { Router } from 'express';
import prisma from '../config/db.ts';
import supabase from '../services/supabase.ts';
import resend from '../services/resend.ts';
import { authenticateAdmin } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { syncPartnerStats } from '../services/partnerSync.ts';

const router = Router();

// Protect all routes
router.use(authenticateAdmin);

// Sync partner stats (all or specific)
router.post('/sync', async (req, res) => {
  try {
    const result = await syncPartnerStats();
    res.json(result);
  } catch (err: any) {
    console.error('Error syncing partner stats:', err);
    res.status(500).json({ error: 'Failed to sync partner stats.' });
  }
});

router.post('/sync/:partnerId', async (req, res) => {
  try {
    const result = await syncPartnerStats(req.params.partnerId);
    res.json(result);
  } catch (err: any) {
    console.error('Error syncing partner stats:', err);
    res.status(500).json({ error: 'Failed to sync partner stats.' });
  }
});

// Create a partner account and send invitation email
router.post('/create', async (req: AuthRequest, res) => {
  const { 
    email, 
    name, 
    phone, 
    role, 
    commissionMethod, 
    commissionValue, 
    studentBonusValue,
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

    // Auto-generate internal password — never shared with the partner
    const crypto = await import('crypto');
    const autoPassword = crypto.randomUUID() + crypto.randomUUID();

    // Create user in Supabase Auth
    const { data: sbData, error: sbError } = await supabase.auth.admin.createUser({
      email,
      password: autoPassword,
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
        studentBonusValue: studentBonusValue ? Number(studentBonusValue) : null,
        coachingCenterId: coachingCenterId || null,
        createdBy: adminEmail,
        isEmailVerified: true,
        partnerBalance: {
          create: {}
        }
      }
    });

    // Send email using Resend
    await resend.emails.send({
      from: 'Mentivo Admin <admin@mentivo.in>',
      to: email,
      subject: 'Welcome to Mentivo Partner Program - Your Account Is Ready',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #0077CB; margin-bottom: 16px;">Welcome to Mentivo, ${name}!</h2>
          <p>You have been registered as a <strong>${role.replace('_', ' ')}</strong> on the Mentivo Partner platform.</p>
          <p>Your account is now active. To access your partner dashboard, simply visit the link below and log in using a one-time code sent to this email address.</p>
          <div style="margin: 24px 0;">
            <a href="https://www.mentivo.in/login" style="background-color: #0077CB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Access Your Dashboard</a>
          </div>
          <p style="font-size: 13px; color: #475569;">On the login page, select <strong>"I am a Coaching Partner"</strong>, enter this email address, and we will send you a verification code.</p>
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
  const { commissionMethod, commissionValue, studentBonusValue } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        commissionMethod,
        commissionValue: commissionValue ? Number(commissionValue) : null,
        studentBonusValue: studentBonusValue ? Number(studentBonusValue) : null
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
