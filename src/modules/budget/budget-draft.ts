import { CostItemDto } from "./types";

export type BudgetItemForm = {
  costItemId: string;
  nome: string;
  unidade: string;
  tipoCusto: "FIXO" | "VARIAVEL_ATLETA" | "VARIAVEL_UNIDADE";
  quantidade: string;
  valorUnitario: string;
};

export type BudgetDraft = {
  logoDataUrl: string;
  metaInscritos: string;
  patrocinioPrevisto: string;
  lucroAlvoPercentual: string;
  taxaPlataformaPercentual: string;
  impostoPercentual: string;
  taxaCancelamentoReembolsoPercentual: string;
  items: BudgetItemForm[];
};

export type StoredBudgetDraft = {
  savedAt: string;
  draft: BudgetDraft;
};

export const selectedEventStorageKey = "eventrun:budget:selected-event-id";
export const budgetDraftStorageKeyPrefix = "eventrun:budget:draft:";
export const costItemsUpdatedEvent = "eventrun:cost-items-updated";
export const costCategoryLabels = {
  ESTRUTURA: "Estrutura",
  STAFF: "Staff",
  SEGURANCA: "Segurança",
  MATERIAIS: "Materiais",
  COMUNICACAO: "Comunicação",
  TAXAS: "Taxas",
  LOGISTICA: "Logística",
  OUTROS: "Outros",
} as const;

export function toNumberSafe(value: string) {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function serializeDraft(draft: BudgetDraft) {
  return JSON.stringify({
    ...draft,
    items: draft.items
      .slice()
      .sort((a, b) => a.costItemId.localeCompare(b.costItemId))
      .map((item) => ({
        ...item,
        quantidade: String(item.quantidade),
        valorUnitario: String(item.valorUnitario),
      })),
  });
}

export function getBudgetDraftStorageKey(eventId: string) {
  return `${budgetDraftStorageKeyPrefix}${eventId}`;
}

function isBudgetDraftShape(parsed: Partial<BudgetDraft>) {
  return (
    typeof parsed.logoDataUrl === "string" &&
    typeof parsed.metaInscritos === "string" &&
    typeof parsed.patrocinioPrevisto === "string" &&
    typeof parsed.lucroAlvoPercentual === "string" &&
    typeof parsed.taxaPlataformaPercentual === "string" &&
    typeof parsed.impostoPercentual === "string" &&
    typeof parsed.taxaCancelamentoReembolsoPercentual === "string" &&
    Array.isArray(parsed.items)
  );
}

export function readStoredDraft(eventId: string): StoredBudgetDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getBudgetDraftStorageKey(eventId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as
      | Partial<StoredBudgetDraft>
      | Partial<BudgetDraft>;

    if (
      "draft" in parsed &&
      parsed.draft &&
      typeof parsed.savedAt === "string" &&
      isBudgetDraftShape(parsed.draft)
    ) {
      return {
        savedAt: parsed.savedAt,
        draft: parsed.draft as BudgetDraft,
      };
    }

    const legacyDraft = parsed as Partial<BudgetDraft>;

    if (!isBudgetDraftShape(legacyDraft)) {
      return null;
    }

    return {
      savedAt: "",
      draft: {
        logoDataUrl: legacyDraft.logoDataUrl!,
        metaInscritos: legacyDraft.metaInscritos!,
        patrocinioPrevisto: legacyDraft.patrocinioPrevisto!,
        lucroAlvoPercentual: legacyDraft.lucroAlvoPercentual!,
        taxaPlataformaPercentual: legacyDraft.taxaPlataformaPercentual!,
        impostoPercentual: legacyDraft.impostoPercentual!,
        taxaCancelamentoReembolsoPercentual: legacyDraft.taxaCancelamentoReembolsoPercentual!,
        items: legacyDraft.items as BudgetItemForm[],
      },
    };
  } catch {
    return null;
  }
}

export function writeStoredDraft(eventId: string, draft: BudgetDraft) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredBudgetDraft = {
    savedAt: new Date().toISOString(),
    draft,
  };

  window.localStorage.setItem(getBudgetDraftStorageKey(eventId), JSON.stringify(payload));
}

export function clearStoredDraft(eventId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getBudgetDraftStorageKey(eventId));
}

export function filterCostItems(
  items: CostItemDto[],
  category: string,
  search: string,
) {
  const normalizedSearch = search.trim().toLowerCase();

  return items.filter((item) => {
    const matchesCategory = !category || item.categoria === category;
    const matchesSearch =
      !normalizedSearch ||
      item.nome.toLowerCase().includes(normalizedSearch) ||
      item.unidade.toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });
}
