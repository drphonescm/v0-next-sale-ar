-- Agregar campos de encadenamiento a Sale
ALTER TABLE "Sale" 
  ADD COLUMN IF NOT EXISTS "quoteId" TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryNoteId" TEXT,
  ADD COLUMN IF NOT EXISTS "parentSaleId" TEXT;

CREATE INDEX IF NOT EXISTS "Sale_quoteId_idx" ON "Sale"("quoteId");
CREATE INDEX IF NOT EXISTS "Sale_deliveryNoteId_idx" ON "Sale"("deliveryNoteId");

-- Crear tabla Quote (Presupuestos)
CREATE TABLE IF NOT EXISTS "Quote" (
  "id" TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
  "customerId" TEXT REFERENCES "Customer"("id") ON DELETE SET NULL,
  "total" DOUBLE PRECISION NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "documentNumber" TEXT NOT NULL,
  "documentType" TEXT DEFAULT 'QUOTE',
  "validUntil" TIMESTAMP,
  "notes" TEXT,
  "deletedAt" TIMESTAMP,
  "deletedBy" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Quote_companyId_documentNumber_idx" ON "Quote"("companyId", "documentNumber");

-- Crear tabla QuoteItem
CREATE TABLE IF NOT EXISTS "QuoteItem" (
  "id" TEXT PRIMARY KEY,
  "quoteId" TEXT NOT NULL REFERENCES "Quote"("id") ON DELETE CASCADE,
  "productId" TEXT REFERENCES "Product"("id") ON DELETE SET NULL,
  "productName" TEXT,
  "quantity" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL
);

-- Crear tabla DeliveryNote (Remitos)
CREATE TABLE IF NOT EXISTS "DeliveryNote" (
  "id" TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
  "customerId" TEXT REFERENCES "Customer"("id") ON DELETE SET NULL,
  "total" DOUBLE PRECISION NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "documentNumber" TEXT NOT NULL,
  "documentType" TEXT DEFAULT 'DELIVERY_NOTE',
  "deliveredAt" TIMESTAMP,
  "notes" TEXT,
  "deletedAt" TIMESTAMP,
  "deletedBy" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "DeliveryNote_companyId_documentNumber_idx" ON "DeliveryNote"("companyId", "documentNumber");

-- Crear tabla DeliveryNoteItem
CREATE TABLE IF NOT EXISTS "DeliveryNoteItem" (
  "id" TEXT PRIMARY KEY,
  "deliveryNoteId" TEXT NOT NULL REFERENCES "DeliveryNote"("id") ON DELETE CASCADE,
  "productId" TEXT REFERENCES "Product"("id") ON DELETE SET NULL,
  "productName" TEXT,
  "quantity" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL
);

-- Agregar nuevos tipos de secuencias
INSERT INTO "DocumentSequence" ("id", "companyId", "documentType", "prefix", "currentNumber", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  "id",
  'QUOTE',
  'PRE-',
  0,
  NOW(),
  NOW()
FROM "Company"
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentSequence" WHERE "companyId" = "Company"."id" AND "documentType" = 'QUOTE'
);

INSERT INTO "DocumentSequence" ("id", "companyId", "documentType", "prefix", "currentNumber", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  "id",
  'DELIVERY_NOTE',
  'REM-',
  0,
  NOW(),
  NOW()
FROM "Company"
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentSequence" WHERE "companyId" = "Company"."id" AND "documentType" = 'DELIVERY_NOTE'
);
