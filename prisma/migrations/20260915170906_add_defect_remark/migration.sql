-- AlterTable
ALTER TABLE "qc_inspections" ADD COLUMN     "defect_remark" TEXT;

-- RenameIndex
ALTER INDEX "uq_telegram_chat_message" RENAME TO "qc_inspections_telegram_chat_id_telegram_message_id_key";
