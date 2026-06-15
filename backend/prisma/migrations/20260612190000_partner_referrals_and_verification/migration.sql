-- 1. Create VerificationStatus Enum if not exists
DO $$ BEGIN
    CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add UserRole enum values if not exists
DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE 'coaching_partner';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE 'telegram_partner';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    ALTER TYPE "UserRole" ADD VALUE 'other_partner';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Add columns to users table if not exists
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "commissionMethod" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "commissionValue" DECIMAL(10,2);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referredByReferralCode" TEXT;

-- 4. Create partner_balances table if not exists
CREATE TABLE IF NOT EXISTS "partner_balances" (
    "partnerId" UUID NOT NULL,
    "pendingPayout" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalWithdrawn" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "partner_balances_pkey" PRIMARY KEY ("partnerId")
);

-- 5. Add verificationStatus to mentor_profiles if not exists
ALTER TABLE "mentor_profiles" ADD COLUMN IF NOT EXISTS "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='mentor_profiles' AND column_name='verified'
    ) THEN
        EXECUTE 'UPDATE "mentor_profiles" SET "verificationStatus" = ''VERIFIED'' WHERE "verified" = true';
    END IF;
END $$;

-- 7. Drop verified column if exists
ALTER TABLE "mentor_profiles" DROP COLUMN IF EXISTS "verified";

-- 8. Create index and foreign keys if not exists
DO $$ BEGIN
    CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");
EXCEPTION
    WHEN duplicate_table OR duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "users" ADD CONSTRAINT "users_referredByReferralCode_fkey" FOREIGN KEY ("referredByReferralCode") REFERENCES "users"("referralCode") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "partner_balances" ADD CONSTRAINT "partner_balances_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
