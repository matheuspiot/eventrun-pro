import { CostType } from "@prisma/client";

export type EventBudgetItemDto = {
  id: string;
  costItemId: string;
  nome: string;
  unidade: string;
  tipoCusto: CostType;
  quantidade: string;
  valorUnitario: string;
};

export type EventBudgetDto = {
  id: string;
  eventId: string;
  logoDataUrl: string | null;
  metaInscritos: number;
  patrocinioPrevisto: string;
  lucroAlvoPercentual: string;
  taxaPlataformaPercentual: string;
  impostoPercentual: string;
  taxaCancelamentoReembolsoPercentual: string;
  criadoEm: string;
  atualizadoEm: string;
  items: EventBudgetItemDto[];
};

export type EventBudgetCalculation = {
  totalCustosFixos: number;
  custoVariavelPorAtleta: number;
  custoTotalEstimado: number;
  breakEvenInscritos: number;
  precoMinimoInscricao: number;
  precoRecomendadoParaLucro: number;
  aliquotaTotalPercentual: number;
  receitaLiquidaPorInscricao: number;
  lucroLiquidoEstimado: number;
};
