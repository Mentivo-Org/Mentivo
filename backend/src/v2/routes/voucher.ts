import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticateUser } from '../auth/authenticateUser.ts';
import { createVoucherOrder, verifyPayment, fetchPayment } from '../services/razorpay.ts';
import prisma from '../config/db.ts';

const router = Router();

// GET /api/vouchers/eligibility
router.get('/eligibility', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { voucherEligible: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscriptions = await prisma.voucherSubscription.findMany({
      where: { userId },
      orderBy: { purchasedAt: 'desc' }
    });

    res.json({
      eligible: user.voucherEligible,
      subscriptions
    });
  } catch (error) {
    console.error('Failed to fetch voucher eligibility:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/vouchers/purchase
router.post('/purchase', authenticateUser, async (req: Request, res: Response) => {
  const { plan } = req.body;
  const userId = req.user?.id as string;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (plan !== '3000' && plan !== '6000') {
    return res.status(400).json({ error: 'Invalid plan selected' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.voucherEligible) {
      return res.status(403).json({ error: 'Not eligible for voucher purchase' });
    }

    const amount = plan === '3000' ? 3000 : 6000;
    const order = await createVoucherOrder(amount, userId, plan);

    res.json({
      orderId: order.id,
      amount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Voucher Razorpay order creation failed:', error);
    res.status(500).json({ error: 'Failed to create voucher order' });
  }
});

// POST /api/vouchers/confirm
router.post('/confirm', authenticateUser, async (req: Request, res: Response) => {
  const { orderId, paymentId, signature } = req.body;
  const userId = req.user?.id as string;

  try {
    // 1. Verify signature
    if (!verifyPayment(orderId, paymentId, signature)) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // 2. Fetch payment
    const payment = await fetchPayment(paymentId);
    if (!payment || payment.status !== 'captured' || payment.order_id !== orderId) {
      return res.status(400).json({ error: 'Payment capture verification failed' });
    }
    
    const notes = payment.notes as any;
    if (notes?.type !== 'voucher' || notes?.userId !== userId) {
      return res.status(400).json({ error: 'Invalid payment metadata' });
    }

    const plan = notes.plan as string;
    const amountPaid = plan === '3000' ? 3000 : 6000;
    const amountPerInstallment = plan === '3000' ? 550 : 1100;
    const totalCredit = plan === '3000' ? 3300 : 6600;

    const expectedAmountPaise = amountPaid * 100;
    const paymentFee = Number(payment.fee || 0);
    const actualBaseAmountPaise = Number(payment.amount) - paymentFee;

    if (actualBaseAmountPaise !== expectedAmountPaise) {
      return res.status(400).json({ error: 'Payment amount mismatch' });
    }

    // 3. Process subscription creation idempotently
    await prisma.$transaction(async (tx) => {
      // Check if this payment is already processed
      const existing = await tx.voucherSubscription.findFirst({
        where: { razorpayOrderId: orderId }
      });

      if (existing) {
        return; // Already processed
      }

      // Calculate next month's date
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 1);

      // Create subscription
      await tx.voucherSubscription.create({
        data: {
          userId,
          plan,
          amountPaid,
          totalCredit,
          installmentsRemaining: 5, // 1st instalment applied now, 5 left
          amountPerInstallment,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          nextCreditDate: nextDate,
          status: 'active'
        }
      });

      // Credit wallet for the 1st instalment
      await tx.wallet.upsert({
        where: { userId },
        create: { userId, balance: amountPerInstallment },
        update: { balance: { increment: amountPerInstallment } }
      });
      
      // Log as a wallet transaction for history
      await tx.walletTransaction.create({
        data: {
          userId,
          amount: amountPerInstallment,
          type: 'voucher_installment',
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          status: 'success'
        }
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Voucher payment confirmation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
