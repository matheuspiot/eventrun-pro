import { CostType } from "@prisma/client";
import { EventBudgetCalculation } from "./event-budget.types";

type BudgetCalcInput = {
  metaInscritos: number;
  lucroAlvoPercentual: number;
  taxaPlataformaPercentual: number;
  impostoPercentual: number;
  taxaCancelamentoReembolsoPercentual: number;
  items: Array<{
    tipoCusto: CostType;
    quantidade: number;
    valorUnitario: number;
  }>;
};

export function calculateBudgetMetrics(input: BudgetCalcInput): EventBudgetCalculation {
  const totalCustosFixos = input.items
    .filter((item) => item.tipoCusto === "FIXO")
    .reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0);

  const totalVariavelUnidade = input.items
    .filter((item) => item.tipoCusto === "VARIAVEL_UNIDADE")
    .reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0);

  const custoVariavelPorAtleta = input.items
    .filter((item) => item.tipoCusto === "VARIAVEL_ATLETA")
    .reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0);

  const custoVariavelTotal = custoVariavelPorAtleta * input.metaInscritos;
  const custoTotalEstimado = totalCustosFixos + totalVariavelUnidade + custoVariavelTotal;
  const breakEvenInscritos =
    input.metaInscritos > 0 ? custoTotalEstimado / input.metaInscritos : 0;
  const aliquotaTotalPercentual =
    input.taxaPlataformaPercentual +
    input.impostoPercentual +
    input.taxaCancelamentoReembolsoPercentual;
  const fatorLiquido = Math.max(0.01, 1 - aliquotaTotalPercentual / 100);
  const precoMinimoInscricao = breakEvenInscritos / fatorLiquido;
  const precoRecomendadoParaLucro =
    (breakEvenInscritos * (1 + input.lucroAlvoPercentual / 100)) / fatorLiquido;
  const receitaLiquidaPorInscricao = precoRecomendadoParaLucro * fatorLiquido;
  const lucroLiquidoEstimado = receitaLiquidaPorInscricao - breakEvenInscritos;

  return {
    totalCustosFixos,
    custoVariavelPorAtleta,
    custoTotalEstimado,
    breakEvenInscritos,
    precoMinimoInscricao,
    precoRecomendadoParaLucro,
    aliquotaTotalPercentual,
    receitaLiquidaPorInscricao,
    lucroLiquidoEstimado,
  };
}
