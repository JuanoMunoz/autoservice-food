-- Consumo local: entregar en mesa vs para llevar (nullable, retrocompatible)
ALTER TABLE "Order" ADD COLUMN "serveAtTable" BOOLEAN;
