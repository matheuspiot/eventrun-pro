import { CostCategory, CostType, CostUnit } from "@prisma/client";

export type CostItemDto = {
  id: string;
  organizationId: string;
  nome: string;
  categoria: CostCategory;
  tipoCusto: CostType;
  unidade: CostUnit;
  custoPadrao: string;
  descricao: string | null;
  criadoEm: string;
  atualizadoEm: string;
};
