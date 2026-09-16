-- AlterTable
ALTER TABLE "qc_inspections" ADD COLUMN     "found_qty" INTEGER,
ADD COLUMN     "inspection_qty" INTEGER,
ADD COLUMN     "shift" TEXT,
ADD COLUMN     "total_ng" INTEGER;
