import { describe, expect, it } from "vitest";
import { calculateBudgetMetrics } from "./event-budget.calculations";

describe("calculateBudgetMetrics", () => {
  it("calcula custos, break-even e preco recomendado", () => {
    const result = calculateBudgetMetrics({
      metaInscritos: 100,
      lucroAlvoPercentual: 20,
      taxaPlataformaPercentual: 10,
      impostoPercentual: 5,
      taxaCancelamentoReembolsoPercentual: 5,
      items: [
        { tipoCusto: "FIXO", quantidade: 10, valorUnitario: 100 },
        { tipoCusto: "VARIAVEL_UNIDADE", quantidade: 5, valorUnitario: 20 },
        { tipoCusto: "VARIAVEL_ATLETA", quantidade: 2, valorUnitario: 15 },
      ],
    });

    expect(result.totalCustosFixos).toBe(1000);
    expect(result.custoVariavelPorAtleta).toBe(30);
    expect(result.custoTotalEstimado).toBe(4100);
    expect(result.breakEvenInscritos).toBe(41);
    expect(result.precoMinimoInscricao).toBeCloseTo(51.25, 2);
    expect(result.precoRecomendadoParaLucro).toBeCloseTo(61.5, 2);
    expect(result.lucroLiquidoEstimado).toBeCloseTo(8.2, 2);
  });

  it("protege o fator liquido minimo quando as aliquotas passam de 100%", () => {
    const result = calculateBudgetMetrics({
      metaInscritos: 10,
      lucroAlvoPercentual: 0,
      taxaPlataformaPercentual: 70,
      impostoPercentual: 20,
      taxaCancelamentoReembolsoPercentual: 20,
      items: [{ tipoCusto: "FIXO", quantidade: 1, valorUnitario: 100 }],
    });

    expect(result.aliquotaTotalPercentual).toBe(110);
    expect(result.precoMinimoInscricao).toBe(1000);
  });
});
