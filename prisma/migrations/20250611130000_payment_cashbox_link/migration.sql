-- Link payments to cashboxes for treasury integration
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "cashboxId" TEXT;

ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_cashboxId_fkey";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cashboxId_fkey"
  FOREIGN KEY ("cashboxId") REFERENCES "Cashbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Payment_cashboxId_idx" ON "Payment"("cashboxId");
