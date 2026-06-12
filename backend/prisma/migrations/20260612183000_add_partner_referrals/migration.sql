-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'coaching_partner';
ALTER TYPE "UserRole" ADD VALUE 'telegram_partner';
ALTER TYPE "UserRole" ADD VALUE 'other_partner';

-- AlterTable
ALTER TABLE "users" 
ADD COLUMN "commissionMethod" TEXT,
ADD COLUMN "commissionValue" DECIMAL(10,2),
ADD COLUMN "createdBy" TEXT,
ADD COLUMN "referralCode" TEXT,
ADD COLUMN "referredByReferralCode" TEXT;

-- CreateTable
CREATE TABLE "partner_balances" (
    "partnerId" UUID NOT NULL,
    "pendingPayout" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalWithdrawn" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "partner_balances_pkey" PRIMARY KEY ("partnerId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredByReferralCode_fkey" FOREIGN KEY ("referredByReferralCode") REFERENCES "users"("referralCode") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_balances" ADD CONSTRAINT "partner_balances_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;