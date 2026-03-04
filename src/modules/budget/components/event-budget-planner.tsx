"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CostItemDto } from "../types";
import { EventDto } from "@/modules/events/types";
import { calculateBudgetMetrics } from "../event-budget.calculations";

type BudgetItemForm = {
  costItemId: string;
  nome: string;
  unidade: string;
  tipoCusto: "FIXO" | "VARIAVEL_ATLETA" | "VARIAVEL_UNIDADE";
  quantidade: string;
  valorUnitario: string;
};

type EventBudgetResponse = {
  budget: {
    id: string;
    eventId: string;
    logoDataUrl: string | null;
    metaInscritos: number;
    patrocinioPrevisto: string;
    lucroAlvoPercentual: string;
    taxaPlataformaPercentual: string;
    impostoPercentual: string;
    taxaCancelamentoReembolsoPercentual: string;
    items: BudgetItemForm[];
  } | null;
};

type Scenario = {
  label: string;
  inscritos: number;
  receita: number;
  resultado: number;
};

type BudgetDraft = {
  logoDataUrl: string;
  metaInscritos: string;
  patrocinioPrevisto: string;
  lucroAlvoPercentual: string;
  taxaPlataformaPercentual: string;
  impostoPercentual: string;
  taxaCancelamentoReembolsoPercentual: string;
  items: BudgetItemForm[];
};

type PendingAction =
  | { type: "navigate"; href: string }
  | { type: "switchEvent"; eventId: string }
  | null;

const selectedEventStorageKey = "eventrun:budget:selected-event-id";
const costItemsUpdatedEvent = "eventrun:cost-items-updated";

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatEventLabel(event: EventDto) {
  const date = new Date(event.dataEvento).toLocaleDateString("pt-BR");
  return `${event.nomeEvento} - ${event.cidade}/${event.estado} - ${date}`;
}

function toNumberSafe(value: string) {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function serializeDraft(draft: BudgetDraft) {
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

export function EventBudgetPlanner() {
  const router = useRouter();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [costItems, setCostItems] = useState<CostItemDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [metaInscritos, setMetaInscritos] = useState("1000");
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [patrocinioPrevisto, setPatrocinioPrevisto] = useState("0");
  const [lucroAlvoPercentual, setLucroAlvoPercentual] = useState("20");
  const [taxaPlataformaPercentual, setTaxaPlataformaPercentual] = useState("0");
  const [impostoPercentual, setImpostoPercentual] = useState("0");
  const [taxaCancelamentoReembolsoPercentual, setTaxaCancelamentoReembolsoPercentual] =
    useState("0");
  const [items, setItems] = useState<BudgetItemForm[]>([]);
  const [newCostItemId, setNewCostItemId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadedBudget, setLoadedBudget] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const currentDraft = useMemo<BudgetDraft>(
    () => ({
      logoDataUrl,
      metaInscritos,
      patrocinioPrevisto,
      lucroAlvoPercentual,
      taxaPlataformaPercentual,
      impostoPercentual,
      taxaCancelamentoReembolsoPercentual,
      items,
    }),
    [
      metaInscritos,
      logoDataUrl,
      patrocinioPrevisto,
      lucroAlvoPercentual,
      taxaPlataformaPercentual,
      impostoPercentual,
      taxaCancelamentoReembolsoPercentual,
      items,
    ],
  );

  const currentSnapshot = useMemo(() => serializeDraft(currentDraft), [currentDraft]);
  const isDirty =
    hasUserInteracted &&
    loadedBudget &&
    savedSnapshot.length > 0 &&
    currentSnapshot !== savedSnapshot;

  const loadCostItems = useCallback(async (categoria?: string, search?: string) => {
    const params = new URLSearchParams();
    if (categoria) {
      params.set("categoria", categoria);
    }
    if (search) {
      params.set("search", search);
    }
    const response = await fetch(`/api/cost-items?${params.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as { items: CostItemDto[] };
    setCostItems(data.items);
    if (data.items.length > 0 && !data.items.some((item) => item.id === newCostItemId)) {
      setNewCostItemId(data.items[0].id);
    }
  }, [newCostItemId]);

  useEffect(() => {
    async function loadBase() {
      setLoading(true);
      const [eventsResponse, costItemsResponse] = await Promise.all([
        fetch("/api/events", { cache: "no-store" }),
        fetch("/api/cost-items", { cache: "no-store" }),
      ]);

      if (!eventsResponse.ok || !costItemsResponse.ok) {
        setError("Não foi possível carregar eventos e custos.");
        setLoading(false);
        return;
      }

      const eventsData = (await eventsResponse.json()) as { events: EventDto[] };
      const costItemsData = (await costItemsResponse.json()) as { items: CostItemDto[] };
      setEvents(eventsData.events);
      setCostItems(costItemsData.items);

      const storedEventId =
        typeof window !== "undefined"
          ? window.localStorage.getItem(selectedEventStorageKey)
          : null;
      const initialEventId = eventsData.events.some((event) => event.id === storedEventId)
        ? storedEventId ?? ""
        : (eventsData.events[0]?.id ?? "");
      setSelectedEventId(initialEventId);
      setNewCostItemId(costItemsData.items[0]?.id ?? "");
      setLoading(false);
    }

    void loadBase();
  }, []);

  useEffect(() => {
    function handleCostItemsUpdated() {
      void loadCostItems();
    }
    window.addEventListener(costItemsUpdatedEvent, handleCostItemsUpdated);
    return () => {
      window.removeEventListener(costItemsUpdatedEvent, handleCostItemsUpdated);
    };
  }, [loadCostItems]);

  useEffect(() => {
    async function loadBudget(eventId: string) {
      if (!eventId) {
        setLoadedBudget(true);
        return;
      }

      setLoadedBudget(false);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/event-budgets?eventId=${eventId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setError("Não foi possível carregar o orçamento deste evento.");
        setLoadedBudget(true);
        return;
      }

      const data = (await response.json()) as EventBudgetResponse;

      const serverDraft: BudgetDraft = data.budget
        ? {
            logoDataUrl: data.budget.logoDataUrl ?? "",
            metaInscritos: String(data.budget.metaInscritos),
            patrocinioPrevisto: data.budget.patrocinioPrevisto,
            lucroAlvoPercentual: data.budget.lucroAlvoPercentual,
            taxaPlataformaPercentual: data.budget.taxaPlataformaPercentual,
            impostoPercentual: data.budget.impostoPercentual,
            taxaCancelamentoReembolsoPercentual:
              data.budget.taxaCancelamentoReembolsoPercentual,
            items: data.budget.items,
          }
        : {
            logoDataUrl: "",
            metaInscritos: "1000",
            patrocinioPrevisto: "0",
            lucroAlvoPercentual: "20",
            taxaPlataformaPercentual: "0",
            impostoPercentual: "0",
            taxaCancelamentoReembolsoPercentual: "0",
            items: [],
          };

      setLogoDataUrl(serverDraft.logoDataUrl);
      setMetaInscritos(serverDraft.metaInscritos);
      setPatrocinioPrevisto(serverDraft.patrocinioPrevisto);
      setLucroAlvoPercentual(serverDraft.lucroAlvoPercentual);
      setTaxaPlataformaPercentual(serverDraft.taxaPlataformaPercentual);
      setImpostoPercentual(serverDraft.impostoPercentual);
      setTaxaCancelamentoReembolsoPercentual(
        serverDraft.taxaCancelamentoReembolsoPercentual,
      );
      setItems(serverDraft.items);
      setSavedSnapshot(serializeDraft(serverDraft));
      setHasUserInteracted(false);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(selectedEventStorageKey, eventId);
      }

      setLoadedBudget(true);
    }

    void loadBudget(selectedEventId);
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEventId || !loadedBudget || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(selectedEventStorageKey, selectedEventId);
  }, [selectedEventId, loadedBudget, currentSnapshot]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (!isDirty) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;

      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (nextUrl.origin !== currentUrl.origin) {
        return;
      }

      const sameRoute =
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search &&
        nextUrl.hash === currentUrl.hash;

      if (sameRoute) {
        return;
      }

      event.preventDefault();
      setPendingAction({
        type: "navigate",
        href: `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
      });
      setShowLeaveModal(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isDirty]);

  function handleBudgetLogoUpload(file: File | null) {
    if (!file) {
      setHasUserInteracted(true);
      setLogoDataUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem válido para a logo do orçamento.");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      setHasUserInteracted(true);
      setLogoDataUrl(dataUrl);
    };
    reader.onerror = () => setError("Não foi possível ler o arquivo da logo.");
    reader.readAsDataURL(file);
  }

  function addCostItem() {
    const selected = costItems.find((item) => item.id === newCostItemId);
    if (!selected || items.some((item) => item.costItemId === selected.id)) {
      return;
    }

    setHasUserInteracted(true);
    setItems((prev) => [
      ...prev,
      {
        costItemId: selected.id,
        nome: selected.nome,
        unidade: selected.unidade,
        tipoCusto: selected.tipoCusto,
        quantidade: "1",
        valorUnitario: selected.custoPadrao,
      },
    ]);
  }

  function updateItem(
    costItemId: string,
    field: "quantidade" | "valorUnitario",
    value: string,
  ) {
    setHasUserInteracted(true);
    setItems((prev) =>
      prev.map((item) =>
        item.costItemId === costItemId ? { ...item, [field]: value } : item,
      ),
    );
  }

  function removeItem(costItemId: string) {
    setHasUserInteracted(true);
    setItems((prev) => prev.filter((item) => item.costItemId !== costItemId));
  }

  function handleEventSelection(nextEventId: string) {
    if (nextEventId === selectedEventId) {
      return;
    }
    if (isDirty) {
      setPendingAction({ type: "switchEvent", eventId: nextEventId });
      setShowLeaveModal(true);
      return;
    }
    setSelectedEventId(nextEventId);
  }

  const calculations = useMemo(() => {
    return calculateBudgetMetrics({
      metaInscritos: Number(metaInscritos) || 0,
      lucroAlvoPercentual: Number(lucroAlvoPercentual) || 0,
      taxaPlataformaPercentual: Number(taxaPlataformaPercentual) || 0,
      impostoPercentual: Number(impostoPercentual) || 0,
      taxaCancelamentoReembolsoPercentual:
        Number(taxaCancelamentoReembolsoPercentual) || 0,
      items: items.map((item) => ({
        tipoCusto: item.tipoCusto,
        quantidade:
          item.tipoCusto === "VARIAVEL_ATLETA"
            ? 1
            : Number(item.quantidade) || 0,
        valorUnitario: Number(item.valorUnitario) || 0,
      })),
    });
  }, [
    items,
    metaInscritos,
    lucroAlvoPercentual,
    taxaPlataformaPercentual,
    impostoPercentual,
    taxaCancelamentoReembolsoPercentual,
  ]);

  const scenarios = useMemo<Scenario[]>(() => {
    const meta = Number(metaInscritos) || 0;
    const patrocinio = Number(patrocinioPrevisto) || 0;

    return [0.6, 0.8, 1].map((ratio) => {
      const inscritos = Math.round(meta * ratio);
      const receita = inscritos * calculations.precoRecomendadoParaLucro + patrocinio;
      return {
        label: `${Math.round(ratio * 100)}%`,
        inscritos,
        receita,
        resultado: receita - calculations.custoTotalEstimado,
      };
    });
  }, [metaInscritos, patrocinioPrevisto, calculations]);

  async function saveBudget() {
    if (!selectedEventId) {
      setError("Selecione um evento para salvar o orçamento.");
      return false;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const normalizedItems = items.map((item) => ({
      ...item,
      quantidadeNumber:
        item.tipoCusto === "VARIAVEL_ATLETA" ? 1 : toNumberSafe(item.quantidade),
      valorUnitarioNumber: toNumberSafe(item.valorUnitario),
    }));

    const invalidItem = normalizedItems.find(
      (item) =>
        !Number.isFinite(item.quantidadeNumber) ||
        item.quantidadeNumber <= 0 ||
        !Number.isFinite(item.valorUnitarioNumber) ||
        item.valorUnitarioNumber < 0,
    );

    if (invalidItem) {
      setError(
        `Preencha quantidade e valor unitário válidos para o custo "${invalidItem.nome}".`,
      );
      setSaving(false);
      return false;
    }

    try {
      const response = await fetch("/api/event-budgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          logoDataUrl: logoDataUrl || null,
          metaInscritos: Number(metaInscritos),
          patrocinioPrevisto: Number(patrocinioPrevisto),
          lucroAlvoPercentual: Number(lucroAlvoPercentual),
          taxaPlataformaPercentual: Number(taxaPlataformaPercentual),
          impostoPercentual: Number(impostoPercentual),
          taxaCancelamentoReembolsoPercentual: Number(
            taxaCancelamentoReembolsoPercentual,
          ),
          items: normalizedItems.map((item) => ({
            costItemId: item.costItemId,
            quantidade: item.quantidadeNumber,
            valorUnitario: item.valorUnitarioNumber,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Não foi possível salvar o orçamento.");
        setSaving(false);
        return false;
      }

      const data = (await response.json()) as EventBudgetResponse;
      if (data.budget) {
        const persistedDraft: BudgetDraft = {
          logoDataUrl: data.budget.logoDataUrl ?? "",
          metaInscritos: String(data.budget.metaInscritos),
          patrocinioPrevisto: data.budget.patrocinioPrevisto,
          lucroAlvoPercentual: data.budget.lucroAlvoPercentual,
          taxaPlataformaPercentual: data.budget.taxaPlataformaPercentual,
          impostoPercentual: data.budget.impostoPercentual,
          taxaCancelamentoReembolsoPercentual:
            data.budget.taxaCancelamentoReembolsoPercentual,
          items: data.budget.items,
        };

        setLogoDataUrl(persistedDraft.logoDataUrl);
        setMetaInscritos(persistedDraft.metaInscritos);
        setPatrocinioPrevisto(persistedDraft.patrocinioPrevisto);
        setLucroAlvoPercentual(persistedDraft.lucroAlvoPercentual);
        setTaxaPlataformaPercentual(persistedDraft.taxaPlataformaPercentual);
        setImpostoPercentual(persistedDraft.impostoPercentual);
        setTaxaCancelamentoReembolsoPercentual(
          persistedDraft.taxaCancelamentoReembolsoPercentual,
        );
        setItems(persistedDraft.items);
        setSavedSnapshot(serializeDraft(persistedDraft));
        setHasUserInteracted(false);

      }

      setSuccess("Orçamento salvo com sucesso.");
      setSaving(false);
      return true;
    } catch {
      setError("Falha de conexão ao salvar o orçamento.");
      setSaving(false);
      return false;
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveBudget();
  }

  async function confirmLeaveAndSave() {
    const ok = await saveBudget();
    if (!ok || !pendingAction) {
      return;
    }

    setShowLeaveModal(false);

    if (pendingAction.type === "navigate") {
      router.push(pendingAction.href);
      return;
    }

    setSelectedEventId(pendingAction.eventId);
    setPendingAction(null);
  }

  function confirmLeaveWithoutSave() {
    if (!pendingAction) {
      setShowLeaveModal(false);
      return;
    }

    setShowLeaveModal(false);

    if (pendingAction.type === "navigate") {
      router.push(pendingAction.href);
      return;
    }

    setSelectedEventId(pendingAction.eventId);
    setPendingAction(null);
  }

  async function handleExportPdf() {
    if (!selectedEventId) {
      setError("Selecione um evento para exportar o orçamento.");
      return;
    }

    setError("");
    setExporting(true);
    try {
      const response = await fetch(`/api/event-budgets/export?eventId=${selectedEventId}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Não foi possível exportar o orçamento em PDF.");
        return;
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `orcamento-${selectedEventId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      setError("Falha de conexão ao exportar o orçamento.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm text-zinc-600">Carregando módulo de orçamento...</p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div>
          <h2 className="text-3xl font-heading text-zinc-900">Orçamento do Evento</h2>
          <p className="text-sm text-zinc-600">
            Selecione custos da biblioteca e simule cenários de inscrição.
          </p>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                Evento
              </label>
              <select
                value={selectedEventId}
                onChange={(event) => handleEventSelection(event.target.value)}
                className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {formatEventLabel(event)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                Meta de inscritos
              </label>
              <input
                type="number"
                min="1"
                value={metaInscritos}
                onChange={(event) => {
                  setHasUserInteracted(true);
                  setMetaInscritos(event.target.value);
                }}
                className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                Patrocínio previsto
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={patrocinioPrevisto}
                onChange={(event) => {
                  setHasUserInteracted(true);
                  setPatrocinioPrevisto(event.target.value);
                }}
                className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                Lucro-alvo (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={lucroAlvoPercentual}
                onChange={(event) => {
                  setHasUserInteracted(true);
                  setLucroAlvoPercentual(event.target.value);
                }}
                className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                Taxa da plataforma (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={taxaPlataformaPercentual}
                onChange={(event) => {
                  setHasUserInteracted(true);
                  setTaxaPlataformaPercentual(event.target.value);
                }}
                className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                Imposto (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={impostoPercentual}
                onChange={(event) => {
                  setHasUserInteracted(true);
                  setImpostoPercentual(event.target.value);
                }}
                className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                Taxa de cancelamento/reembolso (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={taxaCancelamentoReembolsoPercentual}
                onChange={(event) => {
                  setHasUserInteracted(true);
                  setTaxaCancelamentoReembolsoPercentual(event.target.value);
                }}
                className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-muted/60 p-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
              Logo para o PDF do orçamento
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleBudgetLogoUpload(event.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
            />
            {logoDataUrl && (
              <div className="mt-3 rounded-xl border border-border bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoDataUrl} alt="Logo do orçamento" className="max-h-20 w-auto" />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface-muted/60 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  Custos da biblioteca
                </label>
                <select
                  value={newCostItemId}
                  onChange={(event) => setNewCostItemId(event.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                >
                  {costItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={addCostItem}
                className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-zinc-700"
              >
                Selecionar custo
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-zinc-600">
                  <th className="px-3 py-2">Custo</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Quantidade</th>
                  <th className="px-3 py-2">Valor unitário</th>
                  <th className="px-3 py-2">Subtotal</th>
                  <th className="px-3 py-2">Ação</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                      Selecione custos da biblioteca para montar o orçamento.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const effectiveQuantity =
                      item.tipoCusto === "VARIAVEL_ATLETA"
                        ? Number(metaInscritos) || 0
                        : Number(item.quantidade) || 0;
                    const subtotal = effectiveQuantity * (Number(item.valorUnitario) || 0);

                    return (
                      <tr key={item.costItemId} className="border-b border-border/70">
                        <td className="px-3 py-3">
                          <p className="font-medium text-zinc-900">{item.nome}</p>
                          <p className="text-xs text-zinc-500">Unidade: {item.unidade}</p>
                        </td>
                        <td className="px-3 py-3 text-zinc-600">{item.tipoCusto}</td>
                        <td className="px-3 py-3">
                          {item.tipoCusto === "VARIAVEL_ATLETA" ? (
                            <input
                              type="number"
                              value={effectiveQuantity}
                              readOnly
                              className="w-28 rounded-lg border border-border bg-zinc-100 px-2 py-1 text-zinc-600"
                            />
                          ) : (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantidade}
                              onChange={(event) =>
                                updateItem(item.costItemId, "quantidade", event.target.value)
                              }
                              className="w-28 rounded-lg border border-border bg-surface px-2 py-1 outline-none focus:ring-2 focus:ring-accent"
                            />
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <input type="number" min="0" step="0.01" value={item.valorUnitario} onChange={(event) => updateItem(item.costItemId, "valorUnitario", event.target.value)} className="w-32 rounded-lg border border-border bg-surface px-2 py-1 outline-none focus:ring-2 focus:ring-accent" />
                        </td>
                        <td className="px-3 py-3 text-zinc-700">{brl(subtotal)}</td>
                        <td className="px-3 py-3">
                          <button type="button" onClick={() => removeItem(item.costItemId)} className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600">Remover</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <ResultCard label="Total de custos fixos" value={calculations.totalCustosFixos} valueClass="text-zinc-900" />
            <ResultCard label="Custo variável por atleta" value={calculations.custoVariavelPorAtleta} valueClass="text-zinc-900" />
            <ResultCard label="Custo total estimado" value={calculations.custoTotalEstimado} valueClass="text-zinc-900" />
            <ResultCard label="Break-even por inscrito" value={calculations.breakEvenInscritos} valueClass="text-zinc-900" />
            <ResultCard label="Preço mínimo inscrição" value={calculations.precoMinimoInscricao} valueClass="text-amber-600" />
            <ResultCard label="Preço recomendado (lucro)" value={calculations.precoRecomendadoParaLucro} valueClass="text-emerald-600" />
            <div className="rounded-2xl border border-border bg-surface-muted/70 p-4"><p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Alíquota total de taxas</p><p className={`mt-2 text-2xl font-heading ${calculations.aliquotaTotalPercentual < 0 ? "text-red-600" : "text-zinc-900"}`}>{calculations.aliquotaTotalPercentual.toFixed(2)}%</p></div>
            <ResultCard label="Receita líquida por inscrição" value={calculations.receitaLiquidaPorInscricao} valueClass="text-zinc-900" />
            <ResultCard label="Lucro líquido por inscrição" value={calculations.lucroLiquidoEstimado} valueClass="text-zinc-900" />
          </div>

          <div className="rounded-2xl border border-border bg-surface-muted/50 p-4"><h3 className="text-xl font-heading text-zinc-900">Cenário de receita (60%, 80%, 100%)</h3><div className="mt-4 space-y-3">{scenarios.map((scenario) => {const maxRevenue = Math.max(...scenarios.map((item) => item.receita), 1);const width = (scenario.receita / maxRevenue) * 100;const positive = scenario.resultado >= 0;return (<div key={scenario.label}><div className="mb-1 flex items-center justify-between text-xs text-zinc-600"><span>{scenario.label} ({scenario.inscritos} inscritos)</span><span>Receita: {brl(scenario.receita)} | Resultado: {brl(scenario.resultado)}</span></div><div className="h-3 overflow-hidden rounded-full bg-zinc-200"><div className={`h-full rounded-full ${positive ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.max(6, width)}%` }} /></div></div>);})}</div></div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-700">{success}</p>}

          <div className="space-y-2"><div className="flex flex-wrap gap-2"><button type="submit" disabled={saving} className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70">{saving ? "Salvando..." : "Salvar orçamento"}</button><button type="button" onClick={handleExportPdf} disabled={exporting} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-surface-muted disabled:opacity-70">{exporting ? "Exportando..." : "Exportar orçamento em PDF"}</button></div><p className="text-xs text-zinc-500">Rascunho salvo automaticamente neste navegador para o evento selecionado.</p></div>
        </form>
      </section>

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4"><div className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-xl"><h4 className="text-lg font-semibold text-zinc-900">Alterações não salvas</h4><p className="mt-2 text-sm text-zinc-600">Você fez alterações no orçamento. Deseja salvar antes de sair desta tela?</p><div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" className="rounded-lg border border-border px-3 py-2 text-sm text-zinc-700" onClick={() => { setShowLeaveModal(false); setPendingAction(null); }}>Cancelar</button><button type="button" className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700" onClick={confirmLeaveWithoutSave}>Sair sem salvar</button><button type="button" className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white" onClick={() => { void confirmLeaveAndSave(); }}>Salvar e sair</button></div></div></div>
      )}
    </>
  );
}

function ResultCard({ label, value, valueClass }: { label: string; value: number; valueClass: string }) {
  const isNegative = value < 0;
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
      <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-heading ${isNegative ? "text-red-600" : valueClass}`}>{brl(value)}</p>
    </div>
  );
}
