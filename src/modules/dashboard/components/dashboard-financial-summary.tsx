"use client";

import { useEffect, useMemo, useState } from "react";
import { UiIcon } from "@/components/ui-icon";
import { EventDto } from "@/modules/events/types";

type BudgetSummaryResponse = {
  budget: {
    calculations: {
      custoTotalEstimado: number;
      precoMinimoInscricao: number;
      precoRecomendadoParaLucro: number;
      lucroLiquidoEstimado: number;
    };
  } | null;
};

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function DashboardFinancialSummary() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<BudgetSummaryResponse["budget"]>(null);

  useEffect(() => {
    async function loadEvents() {
      const response = await fetch("/api/events", { cache: "no-store" });
      if (!response.ok) {
        setError("Não foi possível carregar os eventos.");
        setLoading(false);
        return;
      }
      const data = (await response.json()) as { events: EventDto[] };
      setEvents(data.events);
      setSelectedEventId(data.events[0]?.id ?? "");
      setLoading(false);
    }
    void loadEvents();
  }, []);

  useEffect(() => {
    async function loadSummary(eventId: string) {
      if (!eventId) {
        setSummary(null);
        setError("");
        return;
      }
      const response = await fetch(`/api/event-budgets?eventId=${eventId}`, { cache: "no-store" });
      if (!response.ok) {
        setError("Não foi possível carregar o resumo financeiro.");
        return;
      }
      const data = (await response.json()) as BudgetSummaryResponse;
      setSummary(data.budget);
      setError("");
    }
    void loadSummary(selectedEventId);
  }, [selectedEventId]);

  const selectedEventName = useMemo(
    () => events.find((item) => item.id === selectedEventId)?.nomeEvento ?? "Evento",
    [events, selectedEventId],
  );

  const chartData = useMemo(() => {
    if (!summary) return [];

    return [
      { label: "Custo", value: summary.calculations.custoTotalEstimado, tone: "neutral" as const },
      { label: "Mínimo", value: summary.calculations.precoMinimoInscricao, tone: "warning" as const },
      { label: "Recomendado", value: summary.calculations.precoRecomendadoParaLucro, tone: "positive" as const },
      {
        label: "Lucro",
        value: summary.calculations.lucroLiquidoEstimado,
        tone: summary.calculations.lucroLiquidoEstimado < 0 ? ("negative" as const) : ("positive" as const),
      },
    ];
  }, [summary]);

  const maxValue = Math.max(...chartData.map((item) => Math.abs(item.value)), 1);
  const healthLabel = summary
    ? summary.calculations.lucroLiquidoEstimado > 0
      ? "Saudável"
      : "Atenção"
    : "-";

  if (loading) {
    return (
      <section id="financeiro" className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm text-zinc-600">Carregando resumo financeiro...</p>
      </section>
    );
  }

  return (
    <section id="financeiro" className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            <UiIcon name="chart" className="h-4 w-4" />
            Visão financeira
          </div>
          <h3 className="mt-1 text-2xl text-zinc-900">Resumo do orçamento</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Escolha um evento para revisar preço mínimo, margem e resultado por inscrição.
          </p>
        </div>
        <select
          value={selectedEventId}
          onChange={(event) => setSelectedEventId(event.target.value)}
          className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent md:w-[320px]"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.nomeEvento}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div>
          <p className="text-sm text-zinc-600">Evento selecionado: {selectedEventName}</p>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

          {!summary ? (
            <p className="mt-4 rounded-2xl border border-dashed border-border bg-surface-muted p-4 text-sm text-zinc-600">
              Este evento ainda não possui orçamento salvo.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card label="Custo total estimado" value={summary.calculations.custoTotalEstimado} tone="neutral" />
              <Card label="Preço mínimo da inscrição" value={summary.calculations.precoMinimoInscricao} tone="warning" />
              <Card label="Preço recomendado" value={summary.calculations.precoRecomendadoParaLucro} tone="positive" />
              <Card label="Lucro líquido por inscrição" value={summary.calculations.lucroLiquidoEstimado} tone={summary.calculations.lucroLiquidoEstimado < 0 ? "negative" : "positive"} />
            </div>
          )}
        </div>

        {summary ? (
          <article className="rounded-3xl border border-border bg-surface-muted/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <UiIcon name="chart" className="h-4 w-4 text-accent" />
                Leitura comparativa
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${healthLabel === "Saudável" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {healthLabel}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {chartData.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs text-zinc-600">
                    <span>{item.label}</span>
                    <span>{brl(item.value)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        item.tone === "positive"
                          ? "bg-emerald-500"
                          : item.tone === "negative"
                            ? "bg-red-500"
                            : item.tone === "warning"
                              ? "bg-amber-500"
                              : "bg-[#007AFF]"
                      }`}
                      style={{ width: `${Math.max(10, (Math.abs(item.value) / maxValue) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}

function Card({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "positive" | "negative" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "metric-positive"
      : tone === "negative"
        ? "metric-negative"
        : tone === "warning"
          ? "text-amber-600"
          : "metric-neutral";

  return (
    <article className="rounded-2xl border border-border bg-surface-muted/70 p-4">
      <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl ${toneClass}`}>{brl(value)}</p>
    </article>
  );
}
