-- Crear tabla de secuencias de documentos
CREATE TABLE IF NOT EXISTS "DocumentSequence" (
  "id" TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
  "documentType" TEXT NOT NULL,
  "prefix" TEXT,
  "currentNumber" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Crear índices
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentSequence_companyId_documentType_key" 
  ON "DocumentSequence"("companyId", "documentType");
CREATE INDEX IF NOT EXISTS "DocumentSequence_companyId_documentType_idx" 
  ON "DocumentSequence"("companyId", "documentType");

-- Agregar campos de documentNumber a Sale
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "documentNumber" TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "documentType" TEXT DEFAULT 'SALE';
CREATE INDEX IF NOT EXISTS "Sale_companyId_documentNumber_idx" 
  ON "Sale"("companyId", "documentNumber");

-- Agregar campos de documentNumber a CashMovement
ALTER TABLE "CashMovement" ADD COLUMN IF NOT EXISTS "documentNumber" TEXT;
ALTER TABLE "CashMovement" ADD COLUMN IF NOT EXISTS "documentType" TEXT;
CREATE INDEX IF NOT EXISTS "CashMovement_companyId_documentNumber_idx" 
  ON "CashMovement"("companyId", "documentNumber");

-- Crear tabla de Pagos
CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
  "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
  "amount" DOUBLE PRECISION NOT NULL,
  "documentNumber" TEXT NOT NULL,
  "documentType" TEXT DEFAULT 'PAYMENT',
  "note" TEXT,
  "deletedAt" TIMESTAMP,
  "deletedBy" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Crear índices para Payment
CREATE INDEX IF NOT EXISTS "Payment_companyId_documentNumber_idx" 
  ON "Payment"("companyId", "documentNumber");
CREATE INDEX IF NOT EXISTS "Payment_customerId_idx" 
  ON "Payment"("customerId");

-- Inicializar secuencias para cada compañía existente
INSERT INTO "DocumentSequence" ("id", "companyId", "documentType", "prefix", "currentNumber")
SELECT 
  gen_random_uuid()::text,
  "id",
  'SALE',
  'VTA-',
  COALESCE((SELECT MAX("internalNumber") FROM "Sale" WHERE "companyId" = "Company"."id"), 0)
FROM "Company"
ON CONFLICT ("companyId", "documentType") DO NOTHING;

INSERT INTO "DocumentSequence" ("id", "companyId", "documentType", "prefix", "currentNumber")
SELECT 
  gen_random_uuid()::text,
  "id",
  'PAYMENT',
  'RBO-',
  0
FROM "Company"
ON CONFLICT ("companyId", "documentType") DO NOTHING;

INSERT INTO "DocumentSequence" ("id", "companyId", "documentType", "prefix", "currentNumber")
SELECT 
  gen_random_uuid()::text,
  "id",
  'CASH_IN',
  'ING-',
  0
FROM "Company"
ON CONFLICT ("companyId", "documentType") DO NOTHING;

INSERT INTO "DocumentSequence" ("id", "companyId", "documentType", "prefix", "currentNumber")
SELECT 
  gen_random_uuid()::text,
  "id",
  'CASH_OUT',
  'EGR-',
  0
FROM "Company"
ON CONFLICT ("companyId", "documentType") DO NOTHING;

COMMENT ON TABLE "DocumentSequence" IS 'Secuencias de números correlativos por tipo de documento';
COMMENT ON COLUMN "DocumentSequence"."documentType" IS 'Tipo de documento: SALE, PAYMENT, CASH_IN, CASH_OUT, CREDIT_NOTE, DEBIT_NOTE, QUOTE';
COMMENT ON COLUMN "DocumentSequence"."prefix" IS 'Prefijo opcional para el número (ej: VTA-, RBO-, ING-)';
COMMENT ON COLUMN "DocumentSequence"."currentNumber" IS 'Último número utilizado para este tipo de documento';
