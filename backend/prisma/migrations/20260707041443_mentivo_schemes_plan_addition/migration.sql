-- AlterTable
ALTER TABLE "users" ADD COLUMN     "voucherEligible" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "voucher_subscriptions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "plan" TEXT NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "totalCredit" DECIMAL(10,2) NOT NULL,
    "installmentsRemaining" INTEGER NOT NULL DEFAULT 6,
    "amountPerInstallment" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "nextCreditDate" TIMESTAMP(3),
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "voucher_subscriptions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "voucher_subscriptions" ADD CONSTRAINT "voucher_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
