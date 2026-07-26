-- CreateEnum
CREATE TYPE "IngredientType" AS ENUM ('FOOD', 'DRINK');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Sauce" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,

    CONSTRAINT "Sauce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drink" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageRoute" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,

    CONSTRAINT "Drink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageRoute" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "type" "IngredientType" NOT NULL,
    "isTopping" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,

    CONSTRAINT "Ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageRoute" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,

    CONSTRAINT "Products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "onSite" BOOLEAN NOT NULL DEFAULT true,
    "address" TEXT NOT NULL,
    "buyerName" TEXT,
    "status" "OrderStatus" NOT NULL,
    "table" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" TEXT,
    "drinkId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemSauce" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "sauceId" TEXT NOT NULL,

    CONSTRAINT "OrderItemSauce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemIngredient" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "OrderItemIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sauce_createdByUserId_idx" ON "Sauce"("createdByUserId");

-- CreateIndex
CREATE INDEX "Drink_createdByUserId_idx" ON "Drink"("createdByUserId");

-- CreateIndex
CREATE INDEX "Ingredients_createdByUserId_idx" ON "Ingredients"("createdByUserId");

-- CreateIndex
CREATE INDEX "Products_createdByUserId_idx" ON "Products"("createdByUserId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_drinkId_idx" ON "OrderItem"("drinkId");

-- CreateIndex
CREATE INDEX "OrderItemSauce_orderItemId_idx" ON "OrderItemSauce"("orderItemId");

-- CreateIndex
CREATE INDEX "OrderItemSauce_sauceId_idx" ON "OrderItemSauce"("sauceId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItemSauce_orderItemId_sauceId_key" ON "OrderItemSauce"("orderItemId", "sauceId");

-- CreateIndex
CREATE INDEX "OrderItemIngredient_orderItemId_idx" ON "OrderItemIngredient"("orderItemId");

-- CreateIndex
CREATE INDEX "OrderItemIngredient_ingredientId_idx" ON "OrderItemIngredient"("ingredientId");

-- AddForeignKey
ALTER TABLE "Sauce" ADD CONSTRAINT "Sauce_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drink" ADD CONSTRAINT "Drink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredients" ADD CONSTRAINT "Ingredients_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_drinkId_fkey" FOREIGN KEY ("drinkId") REFERENCES "Drink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemSauce" ADD CONSTRAINT "OrderItemSauce_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemSauce" ADD CONSTRAINT "OrderItemSauce_sauceId_fkey" FOREIGN KEY ("sauceId") REFERENCES "Sauce"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemIngredient" ADD CONSTRAINT "OrderItemIngredient_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemIngredient" ADD CONSTRAINT "OrderItemIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
