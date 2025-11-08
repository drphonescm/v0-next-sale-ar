-- Script para agregar el campo supplierId a la tabla Product
-- Ejecutar en Neon Console

-- Agregar columna supplierId si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Product' AND column_name = 'supplierId'
  ) THEN
    ALTER TABLE "Product" ADD COLUMN "supplierId" TEXT;
  END IF;
END $$;

-- Eliminar constraint anterior si existe para evitar conflictos
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Product_supplierId_fkey'
  ) THEN
    ALTER TABLE "Product" DROP CONSTRAINT "Product_supplierId_fkey";
  END IF;
END $$;

-- Agregar foreign key constraint
ALTER TABLE "Product" 
  ADD CONSTRAINT "Product_supplierId_fkey" 
  FOREIGN KEY ("supplierId") 
  REFERENCES "suppliers"("id") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS "Product_supplierId_idx" ON "Product"("supplierId");
