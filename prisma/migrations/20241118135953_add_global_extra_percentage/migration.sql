-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "products" JSONB[],
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "globalExtraPercentage" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "templateId" TEXT NOT NULL,
    "tambiaCode" TEXT NOT NULL,
    "odooCode" TEXT NOT NULL,
    "tambiaName" TEXT NOT NULL,
    "odooName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "reservePercentage" INTEGER NOT NULL DEFAULT 75,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
