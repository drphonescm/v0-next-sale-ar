-- Tabla para historial de cambios
CREATE TABLE IF NOT EXISTS "ChangeLog" (
  "id" TEXT PRIMARY KEY,
  "module" TEXT NOT NULL,
  "tableName" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "before" TEXT,
  "after" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS "ChangeLog_module_idx" ON "ChangeLog"("module");
CREATE INDEX IF NOT EXISTS "ChangeLog_recordId_idx" ON "ChangeLog"("recordId");
CREATE INDEX IF NOT EXISTS "ChangeLog_createdAt_idx" ON "ChangeLog"("createdAt");
