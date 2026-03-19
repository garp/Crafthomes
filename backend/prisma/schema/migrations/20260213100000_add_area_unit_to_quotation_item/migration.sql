-- AlterTable (area as TEXT to match schema; added here so shadow DB replay order is correct)
ALTER TABLE "QuotationItem" ADD COLUMN IF NOT EXISTS "area" TEXT,
ADD COLUMN IF NOT EXISTS "unitId" TEXT;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
