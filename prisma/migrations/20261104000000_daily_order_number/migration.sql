-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderNumber" INTEGER NOT NULL DEFAULT 1;

-- Backfill histórico: asignar número consecutivo por día según zona horaria Colombia (America/Bogota)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY (DATE("createdAt" AT TIME ZONE 'America/Bogota'))
    ORDER BY "createdAt" ASC, id ASC
  ) as rn
  FROM "Order"
)
UPDATE "Order" o
SET "orderNumber" = ranked.rn
FROM ranked
WHERE o.id = ranked.id;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");

