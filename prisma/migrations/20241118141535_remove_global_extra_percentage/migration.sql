/*
  Warnings:

  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `products` on the `Template` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP CONSTRAINT "Product_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "tambiaCode" DROP NOT NULL,
ALTER COLUMN "tambiaName" DROP NOT NULL,
ALTER COLUMN "reservePercentage" SET DEFAULT 75,
ALTER COLUMN "reservePercentage" SET DATA TYPE DOUBLE PRECISION,
ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Product_id_seq";

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "products",
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "globalExtraPercentage" SET DEFAULT 10,
ALTER COLUMN "globalExtraPercentage" SET DATA TYPE DOUBLE PRECISION;
