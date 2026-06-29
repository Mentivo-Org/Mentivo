-- CreateTable
CREATE TABLE "log_entries" (
    "id" UUID NOT NULL,
    "level" VARCHAR(10) NOT NULL,
    "message" TEXT NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "method" VARCHAR(10),
    "endpoint" TEXT,
    "status" INTEGER,
    "duration" INTEGER,
    "ip" VARCHAR(45),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "log_entries_created_at_idx" ON "log_entries"("created_at");

-- CreateIndex
CREATE INDEX "log_entries_level_idx" ON "log_entries"("level");

-- CreateIndex
CREATE INDEX "log_entries_source_idx" ON "log_entries"("source");

-- CreateIndex
CREATE INDEX "log_entries_method_idx" ON "log_entries"("method");

-- CreateIndex
CREATE INDEX "log_entries_status_idx" ON "log_entries"("status");
