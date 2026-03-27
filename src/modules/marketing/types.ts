export type MarketingPackageDto = {
  id: string;
  organizationId: string;
  nome: string;
  descricao: string | null;
  entregaveis: string[];
  investimento: string;
  cronograma: string | null;
  ativo: boolean;
  ordem: number;
  criadoEm: string;
  atualizadoEm: string;
};
