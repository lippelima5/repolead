-- CreateEnum
CREATE TYPE "role" AS ENUM ('owner', 'admin', 'user', 'viewer');

-- CreateEnum
CREATE TYPE "plan_status" AS ENUM ('active', 'trialing', 'pending', 'inactive', 'canceled', 'expired');

-- CreateEnum
CREATE TYPE "invite_status" AS ENUM ('pending', 'accepted', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "source_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "source_environment" AS ENUM ('production', 'staging', 'development');

-- CreateEnum
CREATE TYPE "ingestion_status" AS ENUM ('pending', 'processed', 'duplicate', 'needs_identity', 'failed');

-- CreateEnum
CREATE TYPE "lead_status" AS ENUM ('new', 'contacted', 'qualified', 'won', 'lost', 'needs_identity');

-- CreateEnum
CREATE TYPE "lead_identity_type" AS ENUM ('email', 'phone', 'external');

-- CreateEnum
CREATE TYPE "lead_event_type" AS ENUM ('ingested', 'normalized', 'merged', 'delivered', 'delivery_failed', 'replayed', 'lead_updated');

-- CreateEnum
CREATE TYPE "actor_type" AS ENUM ('system', 'user');

-- CreateEnum
CREATE TYPE "destination_method" AS ENUM ('post', 'put', 'patch');

-- CreateEnum
CREATE TYPE "delivery_status" AS ENUM ('pending', 'success', 'failed', 'dead_letter');

-- CreateEnum
CREATE TYPE "alert_rule_type" AS ENUM ('error_spike', 'silent_source');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "role" "role" NOT NULL DEFAULT 'user',
    "suspended_at" TIMESTAMP(3),
    "suspended_reason" TEXT,
    "reset_token" TEXT,
    "reset_token_expires_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "verification_token" TEXT,
    "verification_token_expires_at" TIMESTAMP(3),
    "workspace_active_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "retention_days" INTEGER NOT NULL DEFAULT 180,
    "idempotency_window_hours" INTEGER NOT NULL DEFAULT 24,
    "plan_status" "plan_status" NOT NULL DEFAULT 'trialing',
    "plan_expires_at" TIMESTAMP(3),
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_user" (
    "workspace_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "role" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_user_pkey" PRIMARY KEY ("workspace_id","user_id")
);

-- CreateTable
CREATE TABLE "workspace_invite" (
    "id" SERIAL NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "role" "role" NOT NULL DEFAULT 'user',
    "token" TEXT NOT NULL,
    "status" "invite_status" NOT NULL DEFAULT 'pending',
    "invited_by_id" INTEGER NOT NULL,
    "accepted_by_id" INTEGER,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source" (
    "id" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "environment" "source_environment" NOT NULL DEFAULT 'production',
    "rate_limit_per_min" INTEGER NOT NULL DEFAULT 60,
    "status" "source_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "hashed_key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion" (
    "id" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "source_id" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content_type" TEXT,
    "raw_payload_json" JSONB,
    "raw_payload_text" TEXT,
    "headers_json" JSONB,
    "idempotency_key" TEXT,
    "size_bytes" INTEGER NOT NULL,
    "status" "ingestion_status" NOT NULL DEFAULT 'pending',
    "duplicate_of_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead" (
    "id" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" "lead_status" NOT NULL DEFAULT 'new',
    "tags_json" JSONB,
    "needs_identity" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_identity" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "type" "lead_identity_type" NOT NULL,
    "value" TEXT NOT NULL,
    "normalized_value" TEXT NOT NULL,
    "source_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_event" (
    "id" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "lead_id" TEXT NOT NULL,
    "type" "lead_event_type" NOT NULL,
    "ingest_id" TEXT,
    "delivery_id" TEXT,
    "actor_type" "actor_type" NOT NULL DEFAULT 'system',
    "actor_user_id" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "old_value_json" JSONB,
    "new_value_json" JSONB,
    "reason" TEXT,

    CONSTRAINT "lead_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destination" (
    "id" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" "destination_method" NOT NULL DEFAULT 'post',
    "headers_json" JSONB,
    "signing_secret_hash" TEXT,
    "signing_secret_prefix" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "subscribed_events_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery" (
    "id" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "destination_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "ingest_id" TEXT,
    "event_type" TEXT NOT NULL,
    "status" "delivery_status" NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3),
    "next_attempt_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_attempt" (
    "id" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "request_payload_json" JSONB NOT NULL,
    "response_status" INTEGER,
    "response_body_text" TEXT,
    "error" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "delivery_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rule" (
    "id" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "type" "alert_rule_type" NOT NULL,
    "config_json" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_event" (
    "id" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "rule_id" TEXT NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload_json" JSONB NOT NULL,
    "delivered_channels_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_rate_limit_bucket" (
    "key" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_rate_limit_bucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "rate_limit_window" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "reset_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_window_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "billing_plan" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stripe_price_id" TEXT NOT NULL,
    "amount_cents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'brl',
    "interval" TEXT NOT NULL DEFAULT 'month',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_slug_key" ON "workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_stripe_customer_id_key" ON "workspace"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_stripe_subscription_id_key" ON "workspace"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_invite_token_key" ON "workspace_invite"("token");

-- CreateIndex
CREATE INDEX "workspace_invite_workspace_id_email_idx" ON "workspace_invite"("workspace_id", "email");

-- CreateIndex
CREATE INDEX "workspace_invite_email_status_idx" ON "workspace_invite"("email", "status");

-- CreateIndex
CREATE INDEX "source_workspace_id_idx" ON "source"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_hashed_key_key" ON "api_key"("hashed_key");

-- CreateIndex
CREATE INDEX "api_key_workspace_id_source_id_idx" ON "api_key"("workspace_id", "source_id");

-- CreateIndex
CREATE INDEX "api_key_source_id_revoked_at_idx" ON "api_key"("source_id", "revoked_at");

-- CreateIndex
CREATE INDEX "ingestion_workspace_id_received_at_idx" ON "ingestion"("workspace_id", "received_at");

-- CreateIndex
CREATE INDEX "ingestion_workspace_id_status_idx" ON "ingestion"("workspace_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ingestion_workspace_id_source_id_idempotency_key_key" ON "ingestion"("workspace_id", "source_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "lead_workspace_id_status_idx" ON "lead"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "lead_workspace_id_created_at_idx" ON "lead"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "lead_identity_lead_id_idx" ON "lead_identity"("lead_id");

-- CreateIndex
CREATE INDEX "lead_identity_workspace_id_source_id_idx" ON "lead_identity"("workspace_id", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_identity_workspace_id_type_normalized_value_key" ON "lead_identity"("workspace_id", "type", "normalized_value");

-- CreateIndex
CREATE INDEX "lead_event_workspace_id_lead_id_timestamp_idx" ON "lead_event"("workspace_id", "lead_id", "timestamp");

-- CreateIndex
CREATE INDEX "destination_workspace_id_idx" ON "destination"("workspace_id");

-- CreateIndex
CREATE INDEX "delivery_workspace_id_status_idx" ON "delivery"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "delivery_workspace_id_next_attempt_at_idx" ON "delivery"("workspace_id", "next_attempt_at");

-- CreateIndex
CREATE INDEX "delivery_workspace_id_destination_id_idx" ON "delivery"("workspace_id", "destination_id");

-- CreateIndex
CREATE INDEX "delivery_attempt_workspace_id_started_at_idx" ON "delivery_attempt"("workspace_id", "started_at");

-- CreateIndex
CREATE INDEX "delivery_attempt_delivery_id_attempt_number_idx" ON "delivery_attempt"("delivery_id", "attempt_number");

-- CreateIndex
CREATE INDEX "alert_rule_workspace_id_enabled_idx" ON "alert_rule"("workspace_id", "enabled");

-- CreateIndex
CREATE INDEX "alert_event_workspace_id_triggered_at_idx" ON "alert_event"("workspace_id", "triggered_at");

-- CreateIndex
CREATE INDEX "source_rate_limit_bucket_workspace_id_source_id_window_star_idx" ON "source_rate_limit_bucket"("workspace_id", "source_id", "window_start");

-- CreateIndex
CREATE INDEX "rate_limit_window_reset_at_idx" ON "rate_limit_window"("reset_at");

-- CreateIndex
CREATE UNIQUE INDEX "billing_plan_key_key" ON "billing_plan"("key");

-- CreateIndex
CREATE UNIQUE INDEX "billing_plan_stripe_price_id_key" ON "billing_plan"("stripe_price_id");

-- CreateIndex
CREATE INDEX "billing_plan_is_active_sort_order_idx" ON "billing_plan"("is_active", "sort_order");

-- AddForeignKey
ALTER TABLE "workspace_user" ADD CONSTRAINT "workspace_user_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_user" ADD CONSTRAINT "workspace_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invite" ADD CONSTRAINT "workspace_invite_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invite" ADD CONSTRAINT "workspace_invite_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invite" ADD CONSTRAINT "workspace_invite_accepted_by_id_fkey" FOREIGN KEY ("accepted_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source" ADD CONSTRAINT "source_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion" ADD CONSTRAINT "ingestion_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion" ADD CONSTRAINT "ingestion_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion" ADD CONSTRAINT "ingestion_duplicate_of_id_fkey" FOREIGN KEY ("duplicate_of_id") REFERENCES "ingestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_identity" ADD CONSTRAINT "lead_identity_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_identity" ADD CONSTRAINT "lead_identity_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_identity" ADD CONSTRAINT "lead_identity_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_event" ADD CONSTRAINT "lead_event_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_event" ADD CONSTRAINT "lead_event_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_event" ADD CONSTRAINT "lead_event_ingest_id_fkey" FOREIGN KEY ("ingest_id") REFERENCES "ingestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_event" ADD CONSTRAINT "lead_event_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_event" ADD CONSTRAINT "lead_event_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination" ADD CONSTRAINT "destination_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery" ADD CONSTRAINT "delivery_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery" ADD CONSTRAINT "delivery_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery" ADD CONSTRAINT "delivery_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery" ADD CONSTRAINT "delivery_ingest_id_fkey" FOREIGN KEY ("ingest_id") REFERENCES "ingestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_attempt" ADD CONSTRAINT "delivery_attempt_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_attempt" ADD CONSTRAINT "delivery_attempt_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rule" ADD CONSTRAINT "alert_rule_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_event" ADD CONSTRAINT "alert_event_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_event" ADD CONSTRAINT "alert_event_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "alert_rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_rate_limit_bucket" ADD CONSTRAINT "source_rate_limit_bucket_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_rate_limit_bucket" ADD CONSTRAINT "source_rate_limit_bucket_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
