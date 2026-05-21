ALTER TABLE "Batch" ADD COLUMN "feedingFee" DECIMAL(65,30);
ALTER TABLE "Batch" ADD COLUMN "medicationFee" DECIMAL(65,30);

UPDATE "Batch"
SET
  "feedingFee" = COALESCE("serviceFee", 0),
  "medicationFee" = 0;

ALTER TABLE "Batch" ALTER COLUMN "feedingFee" SET NOT NULL;
ALTER TABLE "Batch" ALTER COLUMN "medicationFee" SET NOT NULL;
ALTER TABLE "Batch" DROP COLUMN "serviceFee";
