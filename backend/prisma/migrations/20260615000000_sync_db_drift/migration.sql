-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- AlterTable
ALTER TABLE "mentor_profiles" ALTER COLUMN "mentorlevel" DROP NOT NULL,
ALTER COLUMN "mentorlevel" DROP DEFAULT;
