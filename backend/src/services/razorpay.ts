import Razorpay from 'razorpay';
import crypto from 'crypto';

const rz = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Create a Razorpay order for wallet top-up
export async function createTopupOrder(amountRupees: number, userId: string) {
  
  const rawReceipt = `${userId}_${Date.now()}`;
  const shortReceipt = "rcpt_"+crypto.createHash('md5').update(rawReceipt).digest('hex');
  // console.log(shortReceipt);
  return rz.orders.create({
    amount: amountRupees * 100,  // Razorpay uses paise
    currency: 'INR',
    receipt: shortReceipt,
    payment_capture: true, 
    notes: { userId, type: 'wallet_topup' },
  });
}

// Verify Razorpay payment signature after checkout
export function verifyPayment(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if(!secret) return false;

  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body).digest('hex');
  return expected === signature;
}

// Verify Webhook signature
export function verifyWebhookSignature(body: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if(!secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(body).digest('hex');
  return expected === signature;
}

// Payout to mentor bank account via Razorpay X
async function payoutToMentor(mentorId: string, amountRupees: number, bankAccountId: string) {
  // In v2 of razorpay-node, payouts are somewhat separate or you can just make manual REST calls
  // Depending on razorpay-node typings, we might need a workaround if .payouts doesn't exist.
  // Assuming it's part of the extended API or we cast:
  const razorpayAny = rz as any;
  if (!razorpayAny.payouts) {
    throw new Error('Razorpay X payouts not supported in this SDK version. Use direct REST API call.');
  }
  return razorpayAny.payouts.create({
    account_number: process.env.RAZORPAY_X_ACCOUNT,
    fund_account_id: bankAccountId,
    amount: amountRupees * 100,
    currency: 'INR',
    mode: 'IMPS',
    purpose: 'payout',
    notes: { mentorId, type: 'mentor_payout' },
  });
}
