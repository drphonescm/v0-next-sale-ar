-- Script para agregar nuevos campos y tablas

-- Agregar logo a Company
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;

-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE,
  CONSTRAINT "Category_companyId_name_key" UNIQUE ("companyId", "name")
);

-- Agregar categoryId a Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" 
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL;

-- Agregar límite de crédito y deuda a Customer
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "creditLimit" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "currentDebt" DOUBLE PRECISION DEFAULT 0;

-- Hacer productId opcional en SaleItem y agregar productName
ALTER TABLE "SaleItem" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "productName" TEXT;

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS "Category_companyId_idx" ON "Category"("companyId");
CREATE INDEX IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");
