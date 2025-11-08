-- Agregar campos de precio de costo y stock ideal/mínimo a productos
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "stockIdeal" INTEGER,
ADD COLUMN IF NOT EXISTS "stockMinimo" INTEGER;

-- Crear índice único para SKU por compañía (evitar duplicados)
CREATE UNIQUE INDEX IF NOT EXISTS "Product_companyId_sku_key" ON "Product"("companyId", "sku");
