-- Add pincodeId to Address for relation by Pincode.id (allows multiple Pincode rows per pincode number)
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "pincodeId" TEXT;

-- Backfill: link each address to one Pincode row by matching pincode number (pick first match)
UPDATE "Address" SET "pincodeId" = (
  SELECT id FROM "Pincode" WHERE "Pincode"."pincode" = "Address"."pincodeCode" LIMIT 1
)
WHERE "pincodeId" IS NULL;

-- Drop FK from pincodeCode to Pincode.pincode
ALTER TABLE "Address" DROP CONSTRAINT IF EXISTS "Address_pincodeCode_fkey";

-- Add FK from pincodeId to Pincode.id
ALTER TABLE "Address" ADD CONSTRAINT "Address_pincodeId_fkey" FOREIGN KEY ("pincodeId") REFERENCES "Pincode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Allow duplicate pincode numbers (drop unique index on Pincode.pincode)
DROP INDEX IF EXISTS "Pincode_pincode_key";

-- Add non-unique index for lookup performance
CREATE INDEX IF NOT EXISTS "Pincode_pincode_idx" ON "Pincode"("pincode");
