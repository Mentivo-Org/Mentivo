-- AlterTable
ALTER TABLE "notification_logs" ADD COLUMN     "action_target" TEXT,
ADD COLUMN     "action_type" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "action_target" TEXT,
ADD COLUMN     "action_type" TEXT;
