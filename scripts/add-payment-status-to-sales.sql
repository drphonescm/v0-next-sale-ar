-- Agregar campo paymentStatus a la tabla Sale
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'paid';

-- Actualizar ventas existentes: si tienen customerId, marcar como pendiente
UPDATE "Sale" 
SET "paymentStatus" = 'pending' 
WHERE "customerId" IS NOT NULL AND "paymentStatus" = 'paid';
