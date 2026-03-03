"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
    metaInscritos: number;
    patrocinioPrevisto: string;
    lucroAlvoPercentual: string;
    taxaPlataformaPercentual: string;
    impostoPercentual: string;
    taxaCancelamentoReembolsoPercentual: string;
    items: BudgetItemForm[];
    calculations: {
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
  } | null;
};

type Scenario = {
  label: string;
  inscritos: number;
  receita: number;
  resultado: number;
};

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function EventBudgetPlanner() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [costItems, setCostItems] = useState<CostItemDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [metaInscritos, setMetaInscritos] = useState("1000");
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadBase() {
      setLoading(true);
      const [eventsResponse, costItemsResponse] = await Promise.all([
        fetch("/api/events", { cache: "no-store" }),
        fetch("/api/cost-items", { cache: "no-store" }),
      ]);

      if (!eventsResponse.ok || !costItemsResponse.ok) {
        setError("Nao foi possivel carregar eventos e custos");
        setLoading(false);
        return;
      }

      const eventsData = (await eventsResponse.json()) as { events: EventDto[] };
      const costItemsData = (await costItemsResponse.json()) as { items: CostItemDto[] };
      setEvents(eventsData.events);
      setCostItems(costItemsData.items);
      setSelectedEventId(eventsData.events[0]?.id ?? "");
      setNewCostItemId(costItemsData.items[0]?.id ?? "");
      setLoading(false);
    }

    void loadBase();
  }, []);

  useEffect(() => {
    async function loadBudget(eventId: string) {
      if (!eventId) {
        return;
      }

      setError("");
      const response = await fetch(`/api/event-budgets?eventId=${eventId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setError("Nao foi possivel carregar o orcamento deste evento");
        return;
      }

      const data = (await response.json()) as EventBudgetResponse;

      if (!data.budget) {
        setMetaInscritos("1000");
        setPatrocinioPrevisto("0");
        setLucroAlvoPercentual("20");
        setTaxaPlataformaPercentual("0");
        setImpostoPercentual("0");
        setTaxaCancelamentoReembolsoPercentual("0");
        setItems([]);
        return;
      }

      setMetaInscritos(String(data.budget.metaInscritos));
      setPatrocinioPrevisto(data.budget.patrocinioPrevisto);
      setLucroAlvoPercentual(data.budget.lucroAlvoPercentual);
      setTaxaPlataformaPercentual(data.budget.taxaPlataformaPercentual);
      setImpostoPercentual(data.budget.impostoPercentual);
      setTaxaCancelamentoReembolsoPercentual(
        data.budget.taxaCancelamentoReembolsoPercentual,
      );
      setItems(data.budget.items);
    }

    void loadBudget(selectedEventId);
  }, [selectedEventId]);

  function addCostItem() {
    const selected = costItems.find((item) => item.id === newCostItemId);

    if (!selected) {
      return;
    }

    if (items.some((item) => item.costItemId === selected.id)) {
      return;
    }

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
    setItems((prev) =>
      prev.map((item) =>
        item.costItemId === costItemId ? { ...item, [field]: value } : item,
      ),
    );
  }

  function removeItem(costItemId: string) {
    setItems((prev) => prev.filter((item) => item.costItemId !== costItemId));
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
        quantidade: Number(item.quantidade) || 0,
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
      const receita =
        inscritos * calculations.precoRecomendadoParaLucro + patrocinio;
      return {
        label: `${Math.round(ratio * 100)}%`,
        inscritos,
        receita,
        resultado: receita - calculations.custoTotalEstimado,
      };
    });
  }, [metaInscritos, patrocinioPrevisto, calculations]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEventId) {
      setError("Selecione um evento para salvar o orcamento");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/event-budgets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: selectedEventId,
        metaInscritos: Number(metaInscritos),
        patrocinioPrevisto: Number(patrocinioPrevisto),
        lucroAlvoPercentual: Number(lucroAlvoPercentual),
        taxaPlataformaPercentual: Number(taxaPlataformaPercentual),
        impostoPercentual: Number(impostoPercentual),
        taxaCancelamentoReembolsoPercentual: Number(
          taxaCancelamentoReembolsoPercentual,
        ),
        items: items.map((item) => ({
          costItemId: item.costItemId,
          quantidade: Number(item.quantidade),
          valorUnitario: Number(item.valorUnitario),
        })),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Nao foi possivel salvar o orcamento");
      setSaving(false);
      return;
    }

    setSuccess("Orcamento salvo com sucesso");
    setSaving(false);
  }

  if (loading) {
    return (
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm text-zinc-600">Carregando modulo de orcamento...</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <div>
        <h2 className="text-3xl font-heading text-zinc-900">Orcamento do Evento</h2>
        <p className="text-sm text-zinc-600">
          Selecione custos da biblioteca e simule cenarios de inscricao.
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
              onChange={(event) => setSelectedEventId(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.nomeEvento}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
              Meta inscritos
            </label>
            <input
              type="number"
              min="1"
              value={metaInscritos}
              onChange={(event) => setMetaInscritos(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
              Patrocinio previsto
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={patrocinioPrevisto}
              onChange={(event) => setPatrocinioPrevisto(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
              Lucro alvo (%)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={lucroAlvoPercentual}
              onChange={(event) => setLucroAlvoPercentual(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
              Taxa plataforma (%)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={taxaPlataformaPercentual}
              onChange={(event) => setTaxaPlataformaPercentual(event.target.value)}
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
              onChange={(event) => setImpostoPercentual(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
              Taxa cancel/reembolso (%)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={taxaCancelamentoReembolsoPercentual}
              onChange={(event) =>
                setTaxaCancelamentoReembolsoPercentual(event.target.value)
              }
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
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
                    {item.nome} ({item.tipoCusto})
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
                <th className="px-3 py-2">Valor unitario</th>
                <th className="px-3 py-2">Subtotal</th>
                <th className="px-3 py-2">Acao</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                    Selecione custos da biblioteca para montar o orcamento.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const subtotal =
                    (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0);

                  return (
                    <tr key={item.costItemId} className="border-b border-border/70">
                      <td className="px-3 py-3">
                        <p className="font-medium text-zinc-900">{item.nome}</p>
                        <p className="text-xs text-zinc-500">Unidade: {item.unidade}</p>
                      </td>
                      <td className="px-3 py-3 text-zinc-600">{item.tipoCusto}</td>
                      <td className="px-3 py-3">
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
                      <td className="px-3 py-3 text-zinc-700">{brl(subtotal)}</td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => removeItem(item.costItemId)}
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

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Total custos fixos</p>
            <p className="mt-2 text-2xl font-heading text-zinc-900">
              {brl(calculations.totalCustosFixos)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Custo variavel por atleta</p>
            <p className="mt-2 text-2xl font-heading text-zinc-900">
              {brl(calculations.custoVariavelPorAtleta)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Custo total estimado</p>
            <p className="mt-2 text-2xl font-heading text-zinc-900">
              {brl(calculations.custoTotalEstimado)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Break-even por inscrito</p>
            <p className="mt-2 text-2xl font-heading text-zinc-900">
              {brl(calculations.breakEvenInscritos)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Preco minimo inscricao</p>
            <p className="mt-2 text-2xl font-heading text-zinc-900">
              {brl(calculations.precoMinimoInscricao)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
              Preco recomendado (lucro)
            </p>
            <p className="mt-2 text-2xl font-heading text-zinc-900">
              {brl(calculations.precoRecomendadoParaLucro)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
              Aliquota total de taxas
            </p>
            <p className="mt-2 text-2xl font-heading text-zinc-900">
              {calculations.aliquotaTotalPercentual.toFixed(2)}%
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
              Receita liquida por inscricao
            </p>
            <p className="mt-2 text-2xl font-heading text-zinc-900">
              {brl(calculations.receitaLiquidaPorInscricao)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
              Lucro liquido por inscricao
            </p>
            <p className="mt-2 text-2xl font-heading text-zinc-900">
              {brl(calculations.lucroLiquidoEstimado)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-muted/50 p-4">
          <h3 className="text-xl font-heading text-zinc-900">Cenario de receita (60%, 80%, 100%)</h3>
          <div className="mt-4 space-y-3">
            {scenarios.map((scenario) => {
              const maxRevenue = Math.max(...scenarios.map((item) => item.receita), 1);
              const width = (scenario.receita / maxRevenue) * 100;
              const positive = scenario.resultado >= 0;

              return (
                <div key={scenario.label}>
                  <div className="mb-1 flex items-center justify-between text-xs text-zinc-600">
                    <span>
                      {scenario.label} ({scenario.inscritos} inscritos)
                    </span>
                    <span>
                      Receita: {brl(scenario.receita)} | Resultado: {brl(scenario.resultado)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className={`h-full rounded-full ${
                        positive ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.max(6, width)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-700">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70"
        >
          {saving ? "Salvando..." : "Salvar orcamento"}
        </button>
      </form>
    </section>
  );
}
