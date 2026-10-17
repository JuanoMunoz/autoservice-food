-- Observaciones generales, referencia de domicilio y notas por item (retrocompatible, nullable)
ALTER TABLE "Order" ADD COLUMN "addressReference" TEXT,
ADD COLUMN "notes" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "note" TEXT;
