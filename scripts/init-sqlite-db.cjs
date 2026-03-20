const fs = require("node:fs");
const path = require("node:path");
const initSqlJs = require("sql.js");

const schemaSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");

CREATE TABLE IF NOT EXISTS "Event" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "nomeEvento" TEXT NOT NULL,
  "dataEvento" DATETIME NOT NULL,
  "cidade" TEXT NOT NULL,
  "estado" TEXT NOT NULL,
  "localLargada" TEXT NOT NULL,
  "organizador" TEXT NOT NULL,
  "cnpjOrganizador" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PLANEJAMENTO',
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Event_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Event_organizationId_idx" ON "Event"("organizationId");
CREATE INDEX IF NOT EXISTS "Event_dataEvento_idx" ON "Event"("dataEvento");

CREATE TABLE IF NOT EXISTS "CostItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "categoria" TEXT NOT NULL,
  "tipoCusto" TEXT NOT NULL,
  "unidade" TEXT NOT NULL,
  "custoPadrao" REAL NOT NULL,
  "descricao" TEXT,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CostItem_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CostItem_organizationId_idx" ON "CostItem"("organizationId");
CREATE INDEX IF NOT EXISTS "CostItem_categoria_idx" ON "CostItem"("categoria");

CREATE TABLE IF NOT EXISTS "EventBudget" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "logoDataUrl" TEXT,
  "metaInscritos" INTEGER NOT NULL,
  "patrocinioPrevisto" REAL NOT NULL,
  "lucroAlvoPercentual" REAL NOT NULL,
  "taxaPlataformaPercentual" REAL NOT NULL,
  "impostoPercentual" REAL NOT NULL,
  "taxaCancelamentoReembolsoPercentual" REAL NOT NULL DEFAULT 0,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventBudget_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "EventBudget_eventId_key" ON "EventBudget"("eventId");

CREATE TABLE IF NOT EXISTS "EventBudgetItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventBudgetId" TEXT NOT NULL,
  "costItemId" TEXT NOT NULL,
  "quantidade" REAL NOT NULL,
  "valorUnitario" REAL NOT NULL,
  "tipoCusto" TEXT NOT NULL,
  CONSTRAINT "EventBudgetItem_eventBudgetId_fkey"
    FOREIGN KEY ("eventBudgetId") REFERENCES "EventBudget" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EventBudgetItem_costItemId_fkey"
    FOREIGN KEY ("costItemId") REFERENCES "CostItem" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "EventBudgetItem_eventBudgetId_idx" ON "EventBudgetItem"("eventBudgetId");
CREATE INDEX IF NOT EXISTS "EventBudgetItem_costItemId_idx" ON "EventBudgetItem"("costItemId");

CREATE TABLE IF NOT EXISTS "RegulationConfig" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL,
  "possuiKids" BOOLEAN NOT NULL DEFAULT false,
  "possuiChip" BOOLEAN NOT NULL DEFAULT true,
  "possuiPremiacaoDinheiro" BOOLEAN NOT NULL DEFAULT false,
  "logoDataUrl" TEXT,
  "faixaEtariaInicio" INTEGER NOT NULL DEFAULT 18,
  "faixaEtariaFim" INTEGER NOT NULL DEFAULT 80,
  "intervaloFaixaEtaria" INTEGER NOT NULL DEFAULT 5,
  "tempoLimiteMinutos" INTEGER NOT NULL,
  "plataformaInscricao" TEXT NOT NULL,
  "valorInscricao" REAL NOT NULL,
  "limiteVagas" INTEGER NOT NULL,
  "emailContato" TEXT NOT NULL,
  "whatsappContato" TEXT NOT NULL,
  "dataInicioInscricao" DATETIME NOT NULL,
  "dataFimInscricao" DATETIME NOT NULL,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RegulationConfig_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "RegulationConfig_eventId_key" ON "RegulationConfig"("eventId");
`;

async function initSqliteDb(outputArg) {
  if (!outputArg) {
    throw new Error("Informe o caminho do arquivo SQLite a ser criado.");
  }

  const outputPath = path.resolve(process.cwd(), outputArg);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(schemaSql);

  fs.writeFileSync(outputPath, Buffer.from(db.export()));
  db.close();

  console.log(`Banco SQLite inicializado em: ${outputPath}`);
}

module.exports = initSqliteDb;

if (require.main === module) {
  initSqliteDb(process.argv[2]).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
