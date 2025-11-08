-- Crear tabla de proveedores si no existe
CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contactName" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "suppliers_companyId_fkey" FOREIGN KEY ("companyId") 
    REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "suppliers_companyId_idx" ON "suppliers"("companyId");
