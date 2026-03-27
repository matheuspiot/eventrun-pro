-- AlterTable
ALTER TABLE "RegulationConfig" ADD COLUMN     "faixaEtariaFim" INTEGER NOT NULL DEFAULT 80,
ADD COLUMN     "faixaEtariaInicio" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "intervaloFaixaEtaria" INTEGER NOT NULL DEFAULT 5;
