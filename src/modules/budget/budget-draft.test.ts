import { describe, expect, it } from "vitest";
import { filterCostItems, getBudgetDraftStorageKey, serializeDraft, toNumberSafe } from "./budget-draft";

describe("budget draft helpers", () => {
  it("normaliza o storage key por evento", () => {
    expect(getBudgetDraftStorageKey("evt-1")).toBe("eventrun:budget:draft:evt-1");
  });

  it("serializa itens em ordem estavel", () => {
    const serialized = serializeDraft({
      logoDataUrl: "",
      metaInscritos: "100",
      patrocinioPrevisto: "0",
      lucroAlvoPercentual: "20",
      taxaPlataformaPercentual: "5",
      impostoPercentual: "2",
      taxaCancelamentoReembolsoPercentual: "1",
      items: [
        {
          costItemId: "b",
          nome: "B",
          unidade: "UN",
          tipoCusto: "FIXO",
          quantidade: "1",
          valorUnitario: "10",
        },
        {
          costItemId: "a",
          nome: "A",
          unidade: "UN",
          tipoCusto: "FIXO",
          quantidade: "2",
          valorUnitario: "20",
        },
      ],
    });

    expect(serialized.indexOf('"costItemId":"a"')).toBeLessThan(
      serialized.indexOf('"costItemId":"b"'),
    );
  });

  it("filtra por categoria e busca textual", () => {
    const items = [
      {
        id: "1",
        nome: "Kit atleta",
        categoria: "MATERIAIS",
        tipoCusto: "FIXO",
        unidade: "UN",
        custoPadrao: "25",
        descricao: null,
      },
      {
        id: "2",
        nome: "Equipe medica",
        categoria: "STAFF",
        tipoCusto: "FIXO",
        unidade: "PESSOA",
        custoPadrao: "200",
        descricao: null,
      },
    ];

    expect(filterCostItems(items, "STAFF", "med")).toHaveLength(1);
    expect(filterCostItems(items, "", "un")).toHaveLength(1);
  });

  it("converte numeros pt-br com virgula", () => {
    expect(toNumberSafe("12,5")).toBe(12.5);
    expect(Number.isNaN(toNumberSafe("abc"))).toBe(true);
  });
});
