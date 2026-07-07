import { Router } from 'express';
import express from 'express';
import { verifyWebhookSignature } from '../services/razorpay.ts';
import prisma from '../config/db.ts';

const router = Router();

router.post('/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = req.body;

  if (!verifyWebhookSignature(rawBody.toString(), signature)) {
    await prisma.logEntry.create({
      data: {
        level: 'WARN',
        source: 'backend',
        message: 'Invalid Razorpay webhook signature detected (potential spoofing)',
        metadata: { signature, ip: req.ip }
      }
    }).catch(() => {});
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
      const notes = payment?.notes as any;
      const isVoucher = notes?.type === 'voucher';

      if (isVoucher) {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.voucherSubscription.findFirst({
            where: { razorpayOrderId: orderId }
          });

          if (existing) {
            return; // Already processed
          }

          const userId = notes.userId;
          const plan = notes.plan;
          const amountPaid = plan === '3000' ? 3000 : 6000;
          const amountPerInstallment = plan === '3000' ? 550 : 1100;
          const totalCredit = plan === '3000' ? 3300 : 6600;
          
          const expectedAmountPaise = amountPaid * 100;
          const paymentFee = payment.fee || 0;
          const actualBaseAmountPaise = payment.amount - paymentFee;

          if (actualBaseAmountPaise !== expectedAmountPaise) {
            console.error(`[CRITICAL] Voucher amount mismatch for Order ${orderId}`);
            return;
          }

          const nextDate = new Date();
          nextDate.setMonth(nextDate.getMonth() + 1);

          await tx.voucherSubscription.create({
            data: {
              userId,
              plan,
              amountPaid,
              totalCredit,
              installmentsRemaining: 5,
              amountPerInstallment,
              razorpayOrderId: orderId,
              razorpayPaymentId: paymentId,
              nextCreditDate: nextDate,
              status: 'active'
            }
          });

          await tx.wallet.upsert({
            where: { userId },
            create: { userId, balance: amountPerInstallment },
            update: { balance: { increment: amountPerInstallment } }
          });
          
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
          
          await tx.logEntry.create({
            data: {
              level: 'INFO',
              source: 'backend',
              message: `Razorpay voucher payment captured for Order ${orderId}`,
              metadata: { orderId, paymentId, plan, userId }
            }
          });
        });
      } else {
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
          const paymentFee = payment.fee || 0;
          const actualBaseAmountPaise = payment.amount - paymentFee;

          if (actualBaseAmountPaise !== expectedAmountPaise) {
            console.error(`[CRITICAL] Amount mismatch for Order ${orderId}. Expected ${expectedAmountPaise}, got ${payment.amount} (fee: ${paymentFee})`);
            await prisma.logEntry.create({
                data: {
                    level: 'ERROR',
                    source: 'backend',
                    message: `[CRITICAL] Amount mismatch for Order ${orderId}`,
                    metadata: { orderId, expectedAmountPaise, actual: payment.amount, fee: paymentFee }
                }
            }).catch(() => {});
            // In a real production app, we would mark this for manual review or reverse it
            return;
          }

          await tx.wallet.upsert({
            where: { userId: txn.userId },
            create: { userId: txn.userId, balance: txn.amount },
            update: { balance: { increment: txn.amount } }
          });
          
          await tx.logEntry.create({
            data: {
              level: 'INFO',
              source: 'backend',
              message: `Razorpay payment captured for Order ${orderId}`,
              metadata: { orderId, paymentId, amount: txn.amount, userId: txn.userId }
            }
          });
        }
      });
      }
    } else if (event.event === 'payment.failed') {
      await prisma.walletTransaction.updateMany({
        where: { razorpayOrderId: orderId, status: 'pending' },
        data: { status: 'failed', razorpayPaymentId: paymentId }
      });
    }

    res.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    await prisma.logEntry.create({
        data: {
            level: 'ERROR',
            source: 'backend',
            message: `Webhook processing error: ${error.message}`,
            metadata: { error: error.stack, event: event?.event }
        }
    }).catch(() => {});
    res.status(500).send('Internal server error');
  }
});

export default router;
