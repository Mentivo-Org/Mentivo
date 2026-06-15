import { Router } from 'express';
import express from 'express';
import { verifyWebhookSignature } from '../services/razorpay.ts';
import prisma from '../config/db.ts';

const router = Router();

router.post('/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = req.body;

  if (!verifyWebhookSignature(rawBody.toString(), signature)) {
    return res.status(400).send('Invalid signature');
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch (e) {
    return res.status(400).send('Invalid JSON payload');
  }

  try {
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;

    if (event.event === 'payment.captured') {
      // Idempotent processing with race condition prevention
      await prisma.$transaction(async (tx) => {
        // 1. Atomically attempt to update status to success only if it is pending
        const updateResult = await tx.walletTransaction.updateMany({
          where: { razorpayOrderId: orderId, status: 'pending' },
          data: { status: 'success', razorpayPaymentId: paymentId }
        });

        // 2. If no rows were updated, it means another process (client confirm route or duplicate webhook) already handled this
        if (updateResult.count === 0) {
          return;
        }

        const txn = await tx.walletTransaction.findFirst({
          where: { razorpayOrderId: orderId }
        });

        if (txn) {
          // 3. Amount verification sanity check
          const expectedAmountPaise = Number(txn.amount) * 100;
          if (payment.amount !== expectedAmountPaise) {
            console.error(`[CRITICAL] Amount mismatch for Order ${orderId}. Expected ${expectedAmountPaise}, got ${payment.amount}`);
            // In a real production app, we would mark this for manual review or reverse it
            return;
          }

          await tx.wallet.upsert({
            where: { userId: txn.userId },
            create: { userId: txn.userId, balance: txn.amount },
            update: { balance: { increment: txn.amount } }
          });
        }
      });
    } else if (event.event === 'payment.failed') {
      await prisma.walletTransaction.updateMany({
        where: { razorpayOrderId: orderId, status: 'pending' },
        data: { status: 'failed', razorpayPaymentId: paymentId }
      });
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Internal server error');
  }
});

export default router;
