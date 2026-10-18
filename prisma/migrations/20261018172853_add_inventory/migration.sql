-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('INITIAL', 'PURCHASE', 'TRANSFER', 'ADJUSTMENT', 'WASTE');

-- AlterTable
ALTER TABLE "Ingredients" ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'un';

-- CreateTable
CREATE TABLE "stock_location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_stock" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "minQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredient_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movement" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "reason" TEXT,
    "note" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_location_code_key" ON "stock_location"("code");

-- CreateIndex
CREATE INDEX "ingredient_stock_locationId_idx" ON "ingredient_stock"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_stock_ingredientId_locationId_key" ON "ingredient_stock"("ingredientId", "locationId");

-- CreateIndex
CREATE INDEX "inventory_movement_ingredientId_createdAt_idx" ON "inventory_movement"("ingredientId", "createdAt");

-- CreateIndex
CREATE INDEX "inventory_movement_fromLocationId_idx" ON "inventory_movement"("fromLocationId");

-- CreateIndex
CREATE INDEX "inventory_movement_toLocationId_idx" ON "inventory_movement"("toLocationId");

-- CreateIndex
CREATE INDEX "inventory_movement_createdAt_idx" ON "inventory_movement"("createdAt");

-- AddForeignKey
ALTER TABLE "ingredient_stock" ADD CONSTRAINT "ingredient_stock_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_stock" ADD CONSTRAINT "ingredient_stock_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "stock_location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "stock_location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "stock_location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
