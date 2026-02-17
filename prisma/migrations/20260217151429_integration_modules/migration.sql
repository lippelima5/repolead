-- AlterTable
ALTER TABLE "destination" ADD COLUMN     "integration_config_json" JSONB,
ADD COLUMN     "integration_id" TEXT NOT NULL DEFAULT 'custom-destination';

-- AlterTable
ALTER TABLE "source" ADD COLUMN     "integration_config_json" JSONB,
ADD COLUMN     "integration_id" TEXT NOT NULL DEFAULT 'custom-source';

-- Backfill Source integration_id based on legacy type
UPDATE "source" SET "integration_id" = 'universal-webhook' WHERE "type" = 'webhook';
UPDATE "source" SET "integration_id" = 'form-backend' WHERE "type" = 'form_backend';
UPDATE "source" SET "integration_id" = 'n8n-ingoing' WHERE "type" = 'n8n_ingoing';
UPDATE "source" SET "integration_id" = 'php-form-handler' WHERE "type" = 'php_form_handler';

-- CreateIndex
CREATE INDEX "destination_workspace_id_integration_id_idx" ON "destination"("workspace_id", "integration_id");

-- CreateIndex
CREATE INDEX "source_workspace_id_integration_id_idx" ON "source"("workspace_id", "integration_id");
