-- Agregar script para permitir eliminar productos con ventas asociadas
-- Modificar la constraint de foreign key en sale_items para permitir SET NULL

-- Primero, eliminar la constraint existente si existe
ALTER TABLE "SaleItem" 
DROP CONSTRAINT IF EXISTS "SaleItem_productId_fkey";

-- Recrear la constraint con ON DELETE SET NULL
ALTER TABLE "SaleItem"
ADD CONSTRAINT "SaleItem_productId_fkey" 
FOREIGN KEY ("productId") 
REFERENCES "Product"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Mensaje de confirmación
SELECT 'Constraint actualizado correctamente' AS resultado;
