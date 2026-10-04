-- Cuadre de cuentas con domiciliarios
ALTER TABLE "delivery_log" ADD COLUMN "settled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "settledAt" TIMESTAMP(3),
ADD COLUMN "settledAmount" DECIMAL(65,30),
ADD COLUMN "settledNote" TEXT;
