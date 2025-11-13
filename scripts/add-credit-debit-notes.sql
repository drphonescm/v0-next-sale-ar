-- Crear tabla de Notas de Crédito
CREATE TABLE IF NOT EXISTS "CreditNote" (
  "id" TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
  "customerId" TEXT REFERENCES "Customer"("id") ON DELETE SET NULL,
  "saleId" TEXT REFERENCES "Sale"("id") ON DELETE SET NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "reason" TEXT NOT NULL,
  "documentNumber" TEXT NOT NULL,
  "documentType" TEXT DEFAULT 'CREDIT_NOTE',
  "status" TEXT DEFAULT 'active',
  "deletedAt" TIMESTAMP,
  "deletedBy" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "CreditNote_companyId_documentNumber_idx" ON "CreditNote"("companyId", "documentNumber");
CREATE INDEX IF NOT EXISTS "CreditNote_saleId_idx" ON "CreditNote"("saleId");

-- Crear tabla de Notas de Débito
CREATE TABLE IF NOT EXISTS "DebitNote" (
  "id" TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
  "customerId" TEXT REFERENCES "Customer"("id") ON DELETE SET NULL,
  "saleId" TEXT REFERENCES "Sale"("id") ON DELETE SET NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "reason" TEXT NOT NULL,
  "documentNumber" TEXT NOT NULL,
  "documentType" TEXT DEFAULT 'DEBIT_NOTE',
  "status" TEXT DEFAULT 'active',
  "deletedAt" TIMESTAMP,
  "deletedBy" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "DebitNote_companyId_documentNumber_idx" ON "DebitNote"("companyId", "documentNumber");
CREATE INDEX IF NOT EXISTS "DebitNote_saleId_idx" ON "DebitNote"("saleId");

-- Agregar nuevos tipos de secuencias
INSERT INTO "DocumentSequence" ("id", "companyId", "documentType", "prefix", "currentNumber", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  "id",
  'CREDIT_NOTE',
  'NC-',
  0,
  NOW(),
  NOW()
FROM "Company"
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentSequence" WHERE "companyId" = "Company"."id" AND "documentType" = 'CREDIT_NOTE'
);

INSERT INTO "DocumentSequence" ("id", "companyId", "documentType", "prefix", "currentNumber", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  "id",
  'DEBIT_NOTE',
  'ND-',
  0,
  NOW(),
  NOW()
FROM "Company"
WHERE NOT EXISTS (
  SELECT 1 FROM "DocumentSequence" WHERE "companyId" = "Company"."id" AND "documentType" = 'DEBIT_NOTE'
);
