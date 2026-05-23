/*
  Warnings:

  - Added the required column `expertise` to the `mentor_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "mentor_profiles" ADD COLUMN     "expertise" TEXT NOT NULL;
