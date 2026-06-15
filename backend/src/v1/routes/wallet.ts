import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticateUser } from '../auth/authenticateUser.ts';
import { createTopupOrder, verifyPayment } from '../services/razorpay.ts';
import prisma from '../config/db.ts';

const router = Router();

// GET /api/wallet/balance
router.get('/balance', authenticateUser, async (req:Request, res:Response) => {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user?.id as string } });

    if(!wallet) {
      await prisma.wallet.create({
        data: {
          userId: req.user?.id as string,
          balance: 0
        }
      })
    }
    res.json({ balance: wallet ? Number(wallet.balance) : 0 });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/wallet/topup
router.post('/topup', authenticateUser, async (req, res) => {
  const { amount } = req.body;
  const userId = req.user?.id as string;
  if(!userId) {
    return res.status(401).json({
      error: "Account not authorized to perform such function"
    })
  }
  if (!amount || amount < 10) {
    return res.status(400).json({ error: 'Minimum top-up is ₹10' });
  }

  try {
    const order = await createTopupOrder(amount, userId);
    
    await prisma.walletTransaction.create({
      data: {
        userId: userId,
        amount,
        type: 'topup',
        razorpayOrderId: order.id,
        status: 'pending'
      }
    });

    res.json({
      orderId: order.id,
      amount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    res.status(500).json({ error: 'Failed to create topup order' });
  }
});

// POST /api/wallet/topup/confirm
router.post('/topup/confirm', authenticateUser, async (req: Request, res: Response) => {
  const { orderId, paymentId, signature } = req.body;

  try {
    // 1. Verify signature first before checking DB
    if (!verifyPayment(orderId, paymentId, signature)) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // 2. Process payment idempotently using updateMany to prevent race conditions
    await prisma.$transaction(async (tx) => {
      // Attempt to update only if pending
      const updateResult = await tx.walletTransaction.updateMany({
        where: { razorpayOrderId: orderId, status: 'pending' },
        data: { status: 'success', razorpayPaymentId: paymentId }
      });

      // If count is 0, it means it was already processed (by webhook or duplicate request)
      if (updateResult.count === 0) {
        return;
      }

      const txn = await tx.walletTransaction.findFirst({
        where: { razorpayOrderId: orderId }
      });

      if (txn) {
        await tx.wallet.upsert({
          where: { userId: txn.userId },
          create: { userId: txn.userId, balance: txn.amount },
          update: { balance: { increment: txn.amount } }
        });
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
