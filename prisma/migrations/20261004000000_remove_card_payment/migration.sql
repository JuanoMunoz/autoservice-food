-- Migrate legacy 'card' payments to 'transfer' (card payment method removed)
UPDATE "Order" SET "paymentMethod" = 'transfer' WHERE "paymentMethod" = 'card';
UPDATE "delivery_log" SET "paymentMethod" = 'transfer' WHERE "paymentMethod" = 'card';
