-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PLANEJAMENTO', 'EM_ANDAMENTO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('ESTRUTURA', 'STAFF', 'SEGURANCA', 'MATERIAIS', 'COMUNICACAO', 'TAXAS', 'LOGISTICA', 'OUTROS');

-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('FIXO', 'VARIAVEL_ATLETA', 'VARIAVEL_UNIDADE');

-- CreateEnum
CREATE TYPE "CostUnit" AS ENUM ('UN', 'PESSOA', 'HORA', 'KM', 'LOTE', 'ATLETA');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "nomeEvento" TEXT NOT NULL,
    "dataEvento" TIMESTAMP(3) NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "localLargada" TEXT NOT NULL,
    "organizador" TEXT NOT NULL,
    "cnpjOrganizador" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PLANEJAMENTO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "CostCategory" NOT NULL,
    "tipoCusto" "CostType" NOT NULL,
    "unidade" "CostUnit" NOT NULL,
    "custoPadrao" DECIMAL(10,2) NOT NULL,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBudget" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "metaInscritos" INTEGER NOT NULL,
    "patrocinioPrevisto" DECIMAL(10,2) NOT NULL,
    "lucroAlvoPercentual" DECIMAL(6,2) NOT NULL,
    "taxaPlataformaPercentual" DECIMAL(6,2) NOT NULL,
    "impostoPercentual" DECIMAL(6,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBudgetItem" (
    "id" TEXT NOT NULL,
    "eventBudgetId" TEXT NOT NULL,
    "costItemId" TEXT NOT NULL,
    "quantidade" DECIMAL(10,2) NOT NULL,
    "valorUnitario" DECIMAL(10,2) NOT NULL,
    "tipoCusto" "CostType" NOT NULL,

    CONSTRAINT "EventBudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulationConfig" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "possuiKids" BOOLEAN NOT NULL DEFAULT false,
    "possuiChip" BOOLEAN NOT NULL DEFAULT true,
    "possuiPremiacaoDinheiro" BOOLEAN NOT NULL DEFAULT false,
    "tempoLimiteMinutos" INTEGER NOT NULL,
    "plataformaInscricao" TEXT[],
    "valorInscricao" DECIMAL(10,2) NOT NULL,
    "limiteVagas" INTEGER NOT NULL,
    "emailContato" TEXT NOT NULL,
    "whatsappContato" TEXT NOT NULL,
    "dataInicioInscricao" TIMESTAMP(3) NOT NULL,
    "dataFimInscricao" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegulationConfig_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostItem" ADD CONSTRAINT "CostItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBudget" ADD CONSTRAINT "EventBudget_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBudgetItem" ADD CONSTRAINT "EventBudgetItem_eventBudgetId_fkey" FOREIGN KEY ("eventBudgetId") REFERENCES "EventBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBudgetItem" ADD CONSTRAINT "EventBudgetItem_costItemId_fkey" FOREIGN KEY ("costItemId") REFERENCES "CostItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulationConfig" ADD CONSTRAINT "RegulationConfig_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
