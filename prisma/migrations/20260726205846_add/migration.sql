/*
  Warnings:

  - Added the required column `buyerPhone` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Made the column `buyerName` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "buyerEmail" TEXT,
ADD COLUMN     "buyerPhone" TEXT NOT NULL,
ALTER COLUMN "buyerName" SET NOT NULL;
