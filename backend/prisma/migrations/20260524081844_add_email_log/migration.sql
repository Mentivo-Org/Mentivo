-- CreateTable
CREATE TABLE "email_logs" (
    "id" UUID NOT NULL,
    "sender" TEXT NOT NULL,
    "received_by_id" TEXT[],
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);
