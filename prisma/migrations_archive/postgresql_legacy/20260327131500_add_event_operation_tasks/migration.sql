CREATE TABLE "EventOperationTask" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "fase" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "responsavel" TEXT,
  "prazo" DATETIME,
  "status" TEXT NOT NULL DEFAULT 'PENDENTE',
  "observacoes" TEXT,
  "ordem" INTEGER NOT NULL DEFAULT 0,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventOperationTask_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "EventOperationTask_eventId_idx" ON "EventOperationTask"("eventId");
CREATE INDEX "EventOperationTask_status_idx" ON "EventOperationTask"("status");
