-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "nomeEvento" TEXT NOT NULL,
    "dataEvento" DATETIME NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "localLargada" TEXT NOT NULL,
    "organizador" TEXT NOT NULL,
    "cnpjOrganizador" TEXT NOT NULL,
    "modalidades" TEXT,
    "distancias" TEXT,
    "capacidadeMaxima" INTEGER,
    "limiteTecnico" TEXT,
    "cronogramaResumo" TEXT,
    "patrocinadores" TEXT,
    "fornecedores" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANEJAMENTO',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
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
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "EventOperationTask_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "tipoCusto" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "custoPadrao" REAL NOT NULL,
    "descricao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "CostItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventBudget" (
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
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "EventBudget_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventBudgetItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventBudgetId" TEXT NOT NULL,
    "costItemId" TEXT NOT NULL,
    "quantidade" REAL NOT NULL,
    "valorUnitario" REAL NOT NULL,
    "tipoCusto" TEXT NOT NULL,
    CONSTRAINT "EventBudgetItem_eventBudgetId_fkey" FOREIGN KEY ("eventBudgetId") REFERENCES "EventBudget" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventBudgetItem_costItemId_fkey" FOREIGN KEY ("costItemId") REFERENCES "CostItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegulationConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "templateTipo" TEXT NOT NULL DEFAULT 'CORRIDA_RUA',
    "possuiKids" BOOLEAN NOT NULL DEFAULT false,
    "possuiChip" BOOLEAN NOT NULL DEFAULT true,
    "possuiPremiacaoDinheiro" BOOLEAN NOT NULL DEFAULT false,
    "permiteTransferencia" BOOLEAN NOT NULL DEFAULT false,
    "permiteRetiradaTerceiros" BOOLEAN NOT NULL DEFAULT true,
    "exigeAtestadoMedico" BOOLEAN NOT NULL DEFAULT false,
    "logoDataUrl" TEXT,
    "faixaEtariaInicio" INTEGER NOT NULL DEFAULT 18,
    "faixaEtariaFim" INTEGER NOT NULL DEFAULT 80,
    "intervaloFaixaEtaria" INTEGER NOT NULL DEFAULT 5,
    "tempoLimiteMinutos" INTEGER NOT NULL,
    "plataformaInscricao" TEXT NOT NULL,
    "valorInscricao" REAL NOT NULL,
    "limiteVagas" INTEGER NOT NULL,
    "kitDescricao" TEXT,
    "premiacaoDescricao" TEXT,
    "regrasGeraisExtra" TEXT,
    "documentosObrigatorios" TEXT,
    "politicaCancelamento" TEXT,
    "emailContato" TEXT NOT NULL,
    "whatsappContato" TEXT NOT NULL,
    "dataInicioInscricao" DATETIME NOT NULL,
    "dataFimInscricao" DATETIME NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "RegulationConfig_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketingPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "entregaveis" TEXT NOT NULL,
    "investimento" REAL NOT NULL,
    "cronograma" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "MarketingPackage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "Event_organizationId_idx" ON "Event"("organizationId");

-- CreateIndex
CREATE INDEX "Event_dataEvento_idx" ON "Event"("dataEvento");

-- CreateIndex
CREATE INDEX "EventOperationTask_eventId_idx" ON "EventOperationTask"("eventId");

-- CreateIndex
CREATE INDEX "EventOperationTask_status_idx" ON "EventOperationTask"("status");

-- CreateIndex
CREATE INDEX "CostItem_organizationId_idx" ON "CostItem"("organizationId");

-- CreateIndex
CREATE INDEX "CostItem_categoria_idx" ON "CostItem"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "EventBudget_eventId_key" ON "EventBudget"("eventId");

-- CreateIndex
CREATE INDEX "EventBudgetItem_eventBudgetId_idx" ON "EventBudgetItem"("eventBudgetId");

-- CreateIndex
CREATE INDEX "EventBudgetItem_costItemId_idx" ON "EventBudgetItem"("costItemId");

-- CreateIndex
CREATE UNIQUE INDEX "RegulationConfig_eventId_key" ON "RegulationConfig"("eventId");

-- CreateIndex
CREATE INDEX "MarketingPackage_organizationId_idx" ON "MarketingPackage"("organizationId");
