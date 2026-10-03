-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "paymentMethod" TEXT;

-- CreateTable
CREATE TABLE "delivery_driver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "vehicle" TEXT,
    "licensePlate" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_log" (
    "id" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "driverId" TEXT NOT NULL,
    "orderTotal" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "driverEarning" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "delivery_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_log_orderId_idx" ON "delivery_log"("orderId");

-- CreateIndex
CREATE INDEX "delivery_log_driverId_idx" ON "delivery_log"("driverId");

-- CreateIndex
CREATE INDEX "delivery_log_createdAt_idx" ON "delivery_log"("createdAt");

-- AddForeignKey
ALTER TABLE "delivery_log" ADD CONSTRAINT "delivery_log_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_log" ADD CONSTRAINT "delivery_log_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "delivery_driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

