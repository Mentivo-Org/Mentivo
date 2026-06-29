-- AlterTable
ALTER TABLE "log_entries" ADD COLUMN     "instanceId" VARCHAR(100);

-- CreateIndex
CREATE INDEX "log_entries_instanceId_idx" ON "log_entries"("instanceId");
