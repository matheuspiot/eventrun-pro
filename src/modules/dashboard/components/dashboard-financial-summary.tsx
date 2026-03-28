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

  if (loading) {
    return <section id="financeiro" className="rounded-[32px] border border-border bg-surface p-6 shadow-sm"><p className="text-sm text-zinc-600">Carregando resumo financeiro...</p></section>;
  }

  return (
    <section id="financeiro" className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Visão financeira</p>
          <h3 className="mt-1 text-2xl font-heading text-zinc-900">Resumo do orçamento</h3>
          <p className="mt-2 text-sm text-zinc-600">Escolha um evento para revisar preço mínimo, margem e resultado por inscrição.</p>
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
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      {!summary ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-surface-muted p-4 text-sm text-zinc-600">
          Este evento ainda não possui orçamento salvo.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card label="Custo total estimado" value={brl(summary.calculations.custoTotalEstimado)} />
          <Card label="Preço mínimo da inscrição" value={brl(summary.calculations.precoMinimoInscricao)} />
          <Card label="Preço recomendado" value={brl(summary.calculations.precoRecomendadoParaLucro)} />
          <Card label="Lucro líquido por inscrição" value={brl(summary.calculations.lucroLiquidoEstimado)} />
        </div>
      )}
    </section>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-border bg-surface-muted/70 p-4">
      <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-heading text-zinc-900">{value}</p>
    </article>
  );
}
