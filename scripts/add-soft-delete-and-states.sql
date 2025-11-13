-- Migración para agregar soft delete y estados a los documentos
-- Ejecutar en orden para mantener integridad

-- 1. Agregar campos a Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- 2. Agregar campos a Customer
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- 3. Agregar campos a Sale
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "canceledAt" TIMESTAMP;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "canceledBy" TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "cancelDocId" TEXT;

-- 4. Agregar campos a CashMovement
ALTER TABLE "CashMovement" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
ALTER TABLE "CashMovement" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- 5. Crear índices para mejor performance en consultas
CREATE INDEX IF NOT EXISTS "Product_deletedAt_idx" ON "Product"("deletedAt");
CREATE INDEX IF NOT EXISTS "Product_status_idx" ON "Product"("status");
CREATE INDEX IF NOT EXISTS "Customer_deletedAt_idx" ON "Customer"("deletedAt");
CREATE INDEX IF NOT EXISTS "Customer_status_idx" ON "Customer"("status");
CREATE INDEX IF NOT EXISTS "Sale_deletedAt_idx" ON "Sale"("deletedAt");
CREATE INDEX IF NOT EXISTS "Sale_canceledAt_idx" ON "Sale"("canceledAt");
CREATE INDEX IF NOT EXISTS "CashMovement_deletedAt_idx" ON "CashMovement"("deletedAt");

COMMENT ON COLUMN "Product"."status" IS 'Estado del producto: active, inactive, discontinued';
COMMENT ON COLUMN "Product"."deletedAt" IS 'Fecha de eliminación lógica (soft delete)';
COMMENT ON COLUMN "Customer"."status" IS 'Estado del cliente: active, inactive, blocked';
COMMENT ON COLUMN "Sale"."canceledAt" IS 'Fecha de anulación del documento';
COMMENT ON COLUMN "Sale"."cancelDocId" IS 'ID del documento que anula esta venta';
