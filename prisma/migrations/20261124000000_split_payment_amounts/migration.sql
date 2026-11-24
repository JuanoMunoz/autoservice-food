-- Pago dividido entre efectivo y transferencia en pedidos y domicilios.
-- Nullable + backfill para no romper pedidos históricos.

ALTER TABLE "Order" ADD COLUMN "cashAmount" DECIMAL(12,2);
ALTER TABLE "Order" ADD COLUMN "transferAmount" DECIMAL(12,2);

ALTER TABLE "delivery_log" ADD COLUMN "cashAmount" DECIMAL(12,2);
ALTER TABLE "delivery_log" ADD COLUMN "transferAmount" DECIMAL(12,2);

-- Pedidos históricos: todo el total se cobró por el método registrado.
UPDATE "Order" SET "cashAmount" = "total", "transferAmount" = 0 WHERE "paymentMethod" = 'cash';
UPDATE "Order" SET "cashAmount" = 0, "transferAmount" = "total" WHERE "paymentMethod" = 'transfer';

UPDATE "delivery_log" SET "cashAmount" = "orderTotal", "transferAmount" = 0 WHERE "paymentMethod" = 'cash';
UPDATE "delivery_log" SET "cashAmount" = 0, "transferAmount" = "orderTotal" WHERE "paymentMethod" = 'transfer';
