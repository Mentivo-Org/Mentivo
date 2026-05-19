-- AlterTable
ALTER TABLE "users" ADD COLUMN     "authProvider" TEXT NOT NULL DEFAULT 'email',
ADD COLUMN     "coachingCenterId" UUID;

-- CreateTable
CREATE TABLE "coaching_centers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "commission_rate" DECIMAL(3,2) NOT NULL DEFAULT 0.05,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coaching_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_center_balances" (
    "centerId" UUID NOT NULL,
    "pendingPayout" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalWithdrawn" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "coaching_center_balances_pkey" PRIMARY KEY ("centerId")
);

-- CreateIndex
CREATE UNIQUE INDEX "coaching_centers_code_key" ON "coaching_centers"("code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_coachingCenterId_fkey" FOREIGN KEY ("coachingCenterId") REFERENCES "coaching_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_center_balances" ADD CONSTRAINT "coaching_center_balances_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "coaching_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
