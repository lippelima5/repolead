-- AlterTable
ALTER TABLE "workspace"
  ADD COLUMN "daily_lead_summary_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "last_lead_summary_sent_at" TIMESTAMP(3);
