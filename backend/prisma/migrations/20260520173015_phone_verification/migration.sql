/*
  Warnings:

  - You are about to drop the column `isEmailVerified` on the `users` table. All the data in the column will be lost.
  - Made the column `phone` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "call_sessions" ADD COLUMN     "last_heartbeat_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "mentor_profiles" ADD COLUMN     "upi_id" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isEmailVerified",
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;
