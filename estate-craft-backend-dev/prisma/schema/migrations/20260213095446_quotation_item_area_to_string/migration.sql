-- AlterTable: only alter "area" to TEXT if column exists (migration order: this runs before add_area_unit in timestamp order)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'QuotationItem' AND column_name = 'area'
  ) THEN
    ALTER TABLE "QuotationItem" ALTER COLUMN "area" SET DATA TYPE TEXT USING "area"::TEXT;
  END IF;
END $$;
