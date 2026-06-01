-- AlterTable
ALTER TABLE "users" ADD COLUMN     "favouriteMentors" TEXT[] DEFAULT ARRAY[]::TEXT[];
