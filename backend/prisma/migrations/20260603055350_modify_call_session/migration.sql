-- AlterTable
ALTER TABLE "call_sessions" ADD COLUMN     "scheduled_at" TIMESTAMP(3),
ADD COLUMN     "scheduled_duration" INTEGER;
