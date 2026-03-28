"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UiIcon } from "@/components/ui-icon";
import { useUiFeedback } from "@/components/ui-feedback-provider";
import { CostItemDto } from "../types";
import { EventDto } from "@/modules/events/types";
import { calculateBudgetMetrics } from "../event-budget.calculations";
import {
  BudgetDraft,
  BudgetItemForm,
  clearStoredDraft,
  costCategoryLabels,
  costItemsUpdatedEvent,
  filterCostItems,
  readStoredDraft,
  selectedEventStorageKey,
  serializeDraft,
  toNumberSafe,
  writeStoredDraft,
} from "../budget-draft";

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
    atualizadoEm: string;
    items: BudgetItemForm[];
  } | null;
};

type Scenario = {
  label: string;
  inscritos: number;
  receita: number;
  resultado: number;
};

type PendingAction =
  | { type: "navigate"; href: string }
  | { type: "switchEvent"; eventId: string }
  | null;

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatEventLabel(event: EventDto) {
  const date = new Date(event.dataEvento).toLocaleDateString("pt-BR");
  return `${event.nomeEvento} - ${event.cidade}/${event.estado} - ${date}`;
}

export function EventBudgetPlanner() {
  const router = useRouter();
  const { confirm, showToast } = useUiFeedback();
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
  const [costItemSearch, setCostItemSearch] = useState("");
  const [costItemCategory, setCostItemCategory] = useState("");
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
  const [plannerStep, setPlannerStep] = useState<"cenario" | "custos" | "analise">("cenario");

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
    currentSnapshot !== savedSnapshot;
  const filteredCostItems = useMemo(
    () => filterCostItems(costItems, costItemCategory, costItemSearch),
    [costItemCategory, costItemSearch, costItems],
  );
  const plannerGuide = useMemo(() => {
    if (items.length === 0) {
      return {
        step: "custos" as const,
        title: "Adicione os custos principais",
        description: "Selecione itens da biblioteca para começar a montar a operação financeira.",
      };
    }

    if (!metaInscritos || Number(metaInscritos) <= 0) {
      return {
        step: "cenario" as const,
        title: "Defina a meta de inscritos",
        description: "A meta de inscritos direciona preço, break-even e custos variáveis.",
      };
    }

    return {
      step: "analise" as const,
      title: "Revise os indicadores",
      description: "Agora valide margem, preço mínimo e cenário de receita antes de salvar.",
    };
  }, [items.length, metaInscritos]);

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
    if (filteredCostItems.length === 0) {
      setNewCostItemId("");
      return;
    }

    if (!filteredCostItems.some((item) => item.id === newCostItemId)) {
      setNewCostItemId(filteredCostItems[0].id);
    }
  }, [filteredCostItems, newCostItemId]);

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

      const storedDraftEntry = readStoredDraft(eventId);
      const serverUpdatedAt = data.budget?.atualizadoEm
        ? new Date(data.budget.atualizadoEm).getTime()
        : 0;
      const storedDraftUpdatedAt = storedDraftEntry?.savedAt
        ? new Date(storedDraftEntry.savedAt).getTime()
        : 0;
      const shouldUseStoredDraft = Boolean(
        storedDraftEntry &&
          (!data.budget ||
            Number.isNaN(serverUpdatedAt) ||
            storedDraftUpdatedAt > serverUpdatedAt),
      );
      const activeDraft = shouldUseStoredDraft ? storedDraftEntry!.draft : serverDraft;
      const serverSnapshot = serializeDraft(serverDraft);
      const activeSnapshot = serializeDraft(activeDraft);

      setLogoDataUrl(activeDraft.logoDataUrl);
      setMetaInscritos(activeDraft.metaInscritos);
      setPatrocinioPrevisto(activeDraft.patrocinioPrevisto);
      setLucroAlvoPercentual(activeDraft.lucroAlvoPercentual);
      setTaxaPlataformaPercentual(activeDraft.taxaPlataformaPercentual);
      setImpostoPercentual(activeDraft.impostoPercentual);
      setTaxaCancelamentoReembolsoPercentual(
        activeDraft.taxaCancelamentoReembolsoPercentual,
      );
      setItems(activeDraft.items);
      setSavedSnapshot(serverSnapshot);
      setHasUserInteracted(activeSnapshot !== serverSnapshot);

      if (storedDraftEntry && !shouldUseStoredDraft) {
        clearStoredDraft(eventId);
      }

      if (shouldUseStoredDraft) {
        setSuccess("Rascunho local recuperado neste navegador.");
      }

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
  }, [selectedEventId, loadedBudget]);

  useEffect(() => {
    if (!selectedEventId || !loadedBudget || typeof window === "undefined") {
      return;
    }

    if (currentSnapshot === savedSnapshot) {
      clearStoredDraft(selectedEventId);
      return;
    }

    writeStoredDraft(selectedEventId, currentDraft);
  }, [currentDraft, currentSnapshot, loadedBudget, savedSnapshot, selectedEventId]);

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

  async function removeItem(costItemId: string) {
    const selectedItem = items.find((item) => item.costItemId === costItemId);
    if (!selectedItem) {
      return;
    }

    const confirmed = await confirm({
      title: "Remover custo do orçamento",
      description: `Deseja remover "${selectedItem.nome}" deste orçamento?`,
      confirmLabel: "Remover custo",
      cancelLabel: "Voltar",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    setHasUserInteracted(true);
    setItems((prev) => prev.filter((item) => item.costItemId !== costItemId));
    showToast({
      tone: "info",
      title: "Custo removido",
      message: "O orçamento foi atualizado.",
    });
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
        showToast({
          tone: "error",
          title: "Falha ao salvar orçamento",
          message: "Revise os dados do cenário financeiro e tente novamente.",
        });
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
        if (typeof window !== "undefined" && selectedEventId) {
          clearStoredDraft(selectedEventId);
        }

      }

      setSuccess("Orçamento salvo com sucesso.");
      showToast({
        tone: "success",
        title: "Orçamento salvo",
        message: "Os dados financeiros do evento foram atualizados com sucesso.",
      });
      setSaving(false);
      return true;
    } catch {
      setError("Falha de conexão ao salvar o orçamento.");
      showToast({
        tone: "error",
        title: "Falha de conexão",
        message: "Não foi possível salvar o orçamento agora.",
      });
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
        showToast({
          tone: "error",
          title: "Falha ao exportar PDF",
        });
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
      showToast({
        tone: "success",
        title: "PDF gerado",
        message: "O orçamento foi exportado com sucesso.",
      });
    } catch {
      setError("Falha de conexão ao exportar o orçamento.");
      showToast({
        tone: "error",
        title: "Falha de conexão",
        message: "Não foi possível exportar o orçamento agora.",
      });
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

  if (events.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-border bg-surface p-8 shadow-sm">
        <h2 className="text-3xl font-heading text-zinc-900">Orçamento do evento</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
          Antes de montar um orçamento, crie pelo menos um projeto de corrida no dashboard.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Orçamento guiado
            </p>
            <h2 className="mt-2 text-3xl font-heading text-zinc-900">Planejamento financeiro por etapas</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              Separe o raciocínio em cenário, composição de custos e análise final antes de salvar.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
              <UiIcon name="spark" className="h-4 w-4" />
              Próximo foco
            </div>
            <p className="mt-2 text-lg text-zinc-900">{plannerGuide.title}</p>
            <p className="mt-1 text-sm text-zinc-600">{plannerGuide.description}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            ["cenario", "Etapa 1", "Defina o cenário", "Meta de inscritos, taxas, patrocínio e logo."],
            ["custos", "Etapa 2", "Monte os custos", "Filtre a biblioteca e adicione apenas o que faz sentido."],
            ["analise", "Etapa 3", "Valide o resultado", "Compare preço mínimo, lucro e cenários de receita."],
          ].map(([step, label, title, description]) => (
            <button
              key={step}
              type="button"
              onClick={() => setPlannerStep(step as "cenario" | "custos" | "analise")}
              className={`rounded-2xl border p-4 text-left transition ${
                plannerStep === step
                  ? "border-accent bg-accent text-white shadow-[0_16px_32px_rgba(0,122,255,0.18)]"
                  : plannerGuide.step === step
                    ? "border-blue-200 bg-blue-50"
                    : "border-border bg-surface-muted/70 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <p className={`text-xs uppercase tracking-[0.15em] ${plannerStep === step ? "text-white/70" : "text-zinc-500"}`}>{label}</p>
              <p className={`mt-2 text-lg ${plannerStep === step ? "text-white" : "text-zinc-900"}`}>{title}</p>
              <p className={`mt-2 text-sm ${plannerStep === step ? "text-white/80" : "text-zinc-600"}`}>{description}</p>
            </button>
          ))}
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

          {plannerStep === "cenario" ? (
            <div className="rounded-3xl border border-border bg-surface-muted/55 p-4">
              <div className="mb-4">
                <p className="text-lg font-heading text-zinc-900">Cenário financeiro</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Ajuste premissas da prova antes de entrar nos custos.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white/80 p-4">
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
            </div>
          ) : null}

          {plannerStep === "custos" ? (
            <>
              <div className="rounded-3xl border border-border bg-surface-muted/60 p-4">
                <div className="mb-4">
                  <p className="text-lg font-heading text-zinc-900">Biblioteca de custos</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Filtre por categoria, selecione o item e inclua somente o que faz sentido para esta prova.
                  </p>
                </div>
                <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                      Buscar custo
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                        <UiIcon name="search" className="h-4 w-4" />
                      </span>
                      <input
                        value={costItemSearch}
                        onChange={(event) => setCostItemSearch(event.target.value)}
                        placeholder="Nome ou unidade"
                        className="w-full rounded-xl border border-border bg-surface py-2 pl-10 pr-3 outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                      Categoria
                    </label>
                    <select
                      value={costItemCategory}
                      onChange={(event) => setCostItemCategory(event.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Todas</option>
                      {Object.entries(costCategoryLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                      Custos filtrados
                    </label>
                    <select
                      value={newCostItemId}
                      onChange={(event) => setNewCostItemId(event.target.value)}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                      disabled={filteredCostItems.length === 0}
                    >
                      {filteredCostItems.length === 0 ? (
                        <option value="">Nenhum custo encontrado</option>
                      ) : (
                        filteredCostItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.nome} - {costCategoryLabels[item.categoria]}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="lg:col-span-2 flex flex-wrap items-end gap-3">
                    <button
                      type="button"
                      onClick={addCostItem}
                      disabled={!newCostItemId}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-60"
                    >
                      <UiIcon name="plus" className="h-4 w-4" />
                      Adicionar custo
                    </button>
                    <p className="text-xs text-zinc-500">
                      {filteredCostItems.length} custo(s) disponível(is) no filtro atual.
                    </p>
                  </div>
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
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.valorUnitario}
                                onChange={(event) =>
                                  updateItem(item.costItemId, "valorUnitario", event.target.value)
                                }
                                className="w-32 rounded-lg border border-border bg-surface px-2 py-1 outline-none focus:ring-2 focus:ring-accent"
                              />
                            </td>
                            <td className={`px-3 py-3 ${subtotal > 0 ? "metric-negative" : "metric-neutral"}`}>{brl(subtotal)}</td>
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                onClick={() => void removeItem(item.costItemId)}
                                className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600"
                              >
                                Remover
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {plannerStep === "analise" ? (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <ResultCard label="Total de custos fixos" value={calculations.totalCustosFixos} valueClass="metric-neutral" />
            <ResultCard label="Custo variável por atleta" value={calculations.custoVariavelPorAtleta} valueClass="metric-neutral" />
            <ResultCard label="Custo total estimado" value={calculations.custoTotalEstimado} valueClass="metric-neutral" />
            <ResultCard label="Break-even por inscrito" value={calculations.breakEvenInscritos} valueClass="metric-neutral" />
            <ResultCard label="Preço mínimo inscrição" value={calculations.precoMinimoInscricao} valueClass="text-amber-600" />
            <ResultCard label="Preço recomendado (lucro)" value={calculations.precoRecomendadoParaLucro} valueClass="metric-positive" />
            <div className="rounded-2xl border border-border bg-surface-muted/70 p-4"><p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Alíquota total de taxas</p><p className={`mt-2 text-2xl ${calculations.aliquotaTotalPercentual < 0 ? "metric-negative" : "metric-neutral"}`}>{calculations.aliquotaTotalPercentual.toFixed(2)}%</p></div>
            <ResultCard label="Receita líquida por inscrição" value={calculations.receitaLiquidaPorInscricao} valueClass="metric-neutral" />
            <ResultCard label="Lucro líquido por inscrição" value={calculations.lucroLiquidoEstimado} valueClass={calculations.lucroLiquidoEstimado < 0 ? "metric-negative" : "metric-positive"} />
              </div>

              <div className="rounded-2xl border border-border bg-surface-muted/50 p-4"><h3 className="text-xl font-heading text-zinc-900">Cenário de receita (60%, 80%, 100%)</h3><div className="mt-4 space-y-3">{scenarios.map((scenario) => {const maxRevenue = Math.max(...scenarios.map((item) => item.receita), 1);const width = (scenario.receita / maxRevenue) * 100;const positive = scenario.resultado >= 0;return (<div key={scenario.label}><div className="mb-1 flex items-center justify-between text-xs text-zinc-600"><span>{scenario.label} ({scenario.inscritos} inscritos)</span><span>Receita: {brl(scenario.receita)} | Resultado: {brl(scenario.resultado)}</span></div><div className="h-3 overflow-hidden rounded-full bg-zinc-200"><div className={`h-full rounded-full ${positive ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${Math.max(6, width)}%` }} /></div></div>);})}</div></div>
            </>
          ) : null}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-700">{success}</p>}

          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={plannerStep === "cenario"}
                onClick={() =>
                  setPlannerStep((prev) =>
                    prev === "analise" ? "custos" : "cenario",
                  )
                }
                className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-zinc-700 disabled:opacity-50"
              >
                Voltar etapa
              </button>
              {plannerStep !== "analise" ? (
                <button
                  type="button"
                  onClick={() =>
                    setPlannerStep((prev) =>
                      prev === "cenario" ? "custos" : "analise",
                    )
                  }
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-zinc-800"
                >
                  Próxima etapa
                </button>
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={saving} className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70">{saving ? "Salvando..." : "Salvar orçamento"}</button>
                <button type="button" onClick={handleExportPdf} disabled={exporting} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-surface-muted disabled:opacity-70"><UiIcon name="download" className="h-4 w-4" />{exporting ? "Exportando..." : "Exportar orçamento em PDF"}</button>
              </div>
              <p className="text-xs text-zinc-500">Rascunho salvo automaticamente neste navegador para o evento selecionado.</p>
            </div>
          </div>
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
