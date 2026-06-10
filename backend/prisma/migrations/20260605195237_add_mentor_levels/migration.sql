-- CreateEnum
CREATE TYPE "MentorLevel" AS ENUM ('Verified', 'Standard', 'Signature', 'Fellow');

-- AlterTable
ALTER TABLE "mentor_profiles" ADD COLUMN     "mentorlevel" "MentorLevel" NOT NULL DEFAULT 'Verified';

-- CreateTable
CREATE TABLE "mentor_promotion_conditions" (
    "id" UUID NOT NULL,
    "level" "MentorLevel" NOT NULL,
    "min_calls" INTEGER NOT NULL DEFAULT 0,
    "min_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_promotion_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mentor_promotion_conditions_level_key" ON "mentor_promotion_conditions"("level");
