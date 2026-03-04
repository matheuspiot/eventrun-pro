"use client";

import { useEffect, useMemo, useState } from "react";
import { EventDto } from "@/modules/events/types";

const packages = [
  {
    name: "Start",
    items: ["Diagnostico de marca", "Design de pecas", "Plano de conteudo 4 semanas"],
    investment: "R$ 3.900",
  },
  {
    name: "Performance",
    items: ["Tudo do Start", "Gestao de anuncios", "Relatorio quinzenal"],
    investment: "R$ 7.500",
  },
  {
    name: "Full Race",
    items: ["Tudo do Performance", "Cobertura de prova", "Pos-evento com remarketing"],
    investment: "R$ 12.900",
  },
];

export default function MarketingPage() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      const response = await fetch("/api/events", { cache: "no-store" });
      if (!response.ok) {
        setLoading(false);
        return;
      }
      const data = (await response.json()) as { events: EventDto[] };
      setEvents(data.events);
      setSelectedEventId((prev) => prev || data.events[0]?.id || "");
      setLoading(false);
    }

    void loadEvents();
  }, []);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId],
  );

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Marketing</p>
        <h2 className="mt-2 text-3xl font-heading text-zinc-900">Proposta comercial para organizadores</h2>
        <p className="mt-2 text-zinc-600">
          Estrutura de servico para vender comunicacao visual e marketing completo para corridas.
        </p>
      </header>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
              Evento para proposta
            </label>
            <select
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.nomeEvento} - {event.cidade}/{event.estado}
                </option>
              ))}
            </select>
          </div>
          <a
            href={selectedEventId ? `/api/marketing/export?eventId=${selectedEventId}` : "#"}
            className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white"
          >
            Baixar proposta em PDF
          </a>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-zinc-600">Carregando eventos...</p>
        ) : (
          <p className="mt-4 text-sm text-zinc-700">
            Evento selecionado: <strong>{selectedEvent?.nomeEvento ?? "-"}</strong>
          </p>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {packages.map((pkg) => (
          <article key={pkg.name} className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="text-xl font-heading text-zinc-900">Pacote {pkg.name}</h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700">
              {pkg.items.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-zinc-500">Investimento sugerido</p>
            <p className="text-2xl font-heading text-zinc-900">{pkg.investment}</p>
          </article>
        ))}
      </div>

      <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="text-xl font-heading text-zinc-900">Como apresentar ao cliente</h3>
        <ol className="mt-4 space-y-2 text-sm text-zinc-700">
          <li>1. Mostre o objetivo principal (inscricoes, awareness ou patrocinadores).</li>
          <li>2. Selecione o pacote ideal e ajuste os entregaveis conforme realidade local.</li>
          <li>3. Feche com cronograma de ativacao e metas de conversao por lote.</li>
        </ol>
      </article>
    </section>
  );
}
