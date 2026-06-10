/*
  Warnings:

  - You are about to drop the column `photo_url` on the `mentor_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "mentor_profiles" DROP COLUMN "photo_url";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "photo_url" TEXT;
