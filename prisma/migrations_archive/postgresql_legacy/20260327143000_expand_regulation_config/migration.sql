ALTER TABLE "RegulationConfig" ADD COLUMN "templateTipo" TEXT NOT NULL DEFAULT 'CORRIDA_RUA';
ALTER TABLE "RegulationConfig" ADD COLUMN "permiteTransferencia" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RegulationConfig" ADD COLUMN "permiteRetiradaTerceiros" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "RegulationConfig" ADD COLUMN "exigeAtestadoMedico" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RegulationConfig" ADD COLUMN "kitDescricao" TEXT;
ALTER TABLE "RegulationConfig" ADD COLUMN "premiacaoDescricao" TEXT;
ALTER TABLE "RegulationConfig" ADD COLUMN "regrasGeraisExtra" TEXT;
ALTER TABLE "RegulationConfig" ADD COLUMN "documentosObrigatorios" TEXT;
ALTER TABLE "RegulationConfig" ADD COLUMN "politicaCancelamento" TEXT;
