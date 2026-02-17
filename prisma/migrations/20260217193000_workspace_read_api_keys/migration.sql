CREATE TABLE "workspace_read_api_key" (
  "id" TEXT NOT NULL,
  "workspace_id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "hashed_key" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "last_used_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "workspace_read_api_key_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_read_api_key_hashed_key_key" ON "workspace_read_api_key"("hashed_key");
CREATE INDEX "workspace_read_api_key_workspace_id_revoked_at_idx" ON "workspace_read_api_key"("workspace_id", "revoked_at");

ALTER TABLE "workspace_read_api_key"
  ADD CONSTRAINT "workspace_read_api_key_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;