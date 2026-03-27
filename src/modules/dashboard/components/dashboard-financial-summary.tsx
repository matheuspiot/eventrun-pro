"use client";

import { useEffect, useMemo, useState } from "react";
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
        setError("Nao foi possivel carregar os eventos.");
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

      const response = await fetch(`/api/event-budgets?eventId=${eventId}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        setError("Nao foi possivel carregar o resumo financeiro.");
        return;
      }

      const data = (await response.json()) as BudgetSummaryResponse;
      setError("");
      setSummary(data.budget);
    }

    void loadSummary(selectedEventId);
  }, [selectedEventId]);

  const selectedEventName = useMemo(
    () => events.find((item) => item.id === selectedEventId)?.nomeEvento ?? "Evento",
    [events, selectedEventId],
  );

  if (loading) {
    return (
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm text-zinc-600">Carregando resumo financeiro...</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Visao financeira
          </p>
          <h3 className="mt-1 text-2xl font-heading text-zinc-900">Resumo do orcamento</h3>
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

      <p className="mt-3 text-sm text-zinc-600">Evento selecionado: {selectedEventName}</p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {!summary ? (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-surface-muted p-4 text-sm text-zinc-600">
          Este evento ainda nao possui orcamento salvo.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Custo total estimado</p>
            <p className="mt-2 text-2xl font-heading text-zinc-900">
              {brl(summary.calculations.custoTotalEstimado)}
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Preco minimo inscricao</p>
            <p className="mt-2 text-2xl font-heading text-zinc-900">
              {brl(summary.calculations.precoMinimoInscricao)}
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
              Preco recomendado (lucro)
            </p>
            <p className="mt-2 text-2xl font-heading text-zinc-900">
              {brl(summary.calculations.precoRecomendadoParaLucro)}
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Lucro liquido por inscricao</p>
            <p className="mt-2 text-2xl font-heading text-zinc-900">
              {brl(summary.calculations.lucroLiquidoEstimado)}
            </p>
          </article>
        </div>
      )}
    </section>
  );
}
