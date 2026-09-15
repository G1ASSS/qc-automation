-- CreateEnum
CREATE TYPE "SheetSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- CreateTable qc_inspections
CREATE TABLE "qc_inspections" (
    "id" TEXT NOT NULL,
    "inspection_date" DATE NOT NULL,
    "inspection_type" TEXT NOT NULL,
    "factory" TEXT NOT NULL,
    "process" TEXT,
    "job_number" TEXT NOT NULL,
    "number" INTEGER,
    "machine_number" TEXT,
    "inspection_time" TEXT,
    "qc_check" TEXT,
    "qc_result" TEXT,
    "status" TEXT,
    "original_status" TEXT,
    "original_message" TEXT NOT NULL,
    "telegram_message_id" INTEGER NOT NULL,
    "telegram_chat_id" BIGINT NOT NULL,
    "telegram_user_id" BIGINT,
    "telegram_username" TEXT,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sheet_sync_status" TEXT NOT NULL DEFAULT 'PENDING',
    "sheet_row_number" INTEGER,
    "sheet_synced_at" TIMESTAMPTZ(6),
    "sheet_sync_error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "qc_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable failed_messages
CREATE TABLE "failed_messages" (
    "id" TEXT NOT NULL,
    "original_message" TEXT NOT NULL,
    "telegram_message_id" INTEGER,
    "telegram_chat_id" BIGINT,
    "telegram_user_id" BIGINT,
    "telegram_username" TEXT,
    "error_reason" TEXT NOT NULL,
    "missing_fields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "failed_messages_pkey" PRIMARY KEY ("id")
);

-- Constraints + indexes
CREATE UNIQUE INDEX "uq_telegram_chat_message" ON "qc_inspections"("telegram_chat_id", "telegram_message_id");
CREATE INDEX "idx_qc_inspection_date" ON "qc_inspections"("inspection_date");
CREATE INDEX "idx_qc_factory" ON "qc_inspections"("factory");
CREATE INDEX "idx_qc_job_number" ON "qc_inspections"("job_number");
CREATE INDEX "idx_qc_machine_number" ON "qc_inspections"("machine_number");
CREATE INDEX "idx_qc_status" ON "qc_inspections"("status");
CREATE INDEX "idx_qc_telegram_message_id" ON "qc_inspections"("telegram_message_id");
CREATE INDEX "idx_qc_sheet_sync_status" ON "qc_inspections"("sheet_sync_status");
CREATE INDEX "idx_failed_telegram_ids" ON "failed_messages"("telegram_chat_id", "telegram_message_id");
CREATE INDEX "idx_failed_resolved" ON "failed_messages"("resolved");
