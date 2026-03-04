"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { EventDto } from "@/modules/events/types";
import { generateRegulationText } from "../generate-regulation-text";
import { RegulationConfigDto } from "../types";

const steps = [
  "Etapa 1 - Identidade",
  "Etapa 2 - Modalidades",
  "Etapa 3 - Inscrição",
  "Etapa 4 - Kit",
  "Etapa 5 - Premiação",
  "Etapa 6 - Contatos",
];

const platformOptions = ["TicketSports", "Sympla", "Minhas Inscrições", "Site Próprio"];

const defaultConfig = {
  possuiKids: false,
  possuiChip: true,
  possuiPremiacaoDinheiro: false,
  tempoLimiteMinutos: "180",
  plataformaInscricao: ["TicketSports"],
  valorInscricao: "0",
  limiteVagas: "1000",
  emailContato: "",
  whatsappContato: "",
  dataInicioInscricao: "",
  dataFimInscricao: "",
};

export function RegulationBuilder() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(defaultConfig);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId],
  );

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      const response = await fetch("/api/events", { cache: "no-store" });
      if (!response.ok) {
        setError("Não foi possível carregar eventos");
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
    async function loadConfig() {
      if (!selectedEventId) {
        return;
      }

      setError("");
      const response = await fetch(`/api/regulation-config?eventId=${selectedEventId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setError("Não foi possível carregar configuração do regulamento");
        return;
      }

      const data = (await response.json()) as { config: RegulationConfigDto | null };
      if (!data.config) {
        setForm(defaultConfig);
        return;
      }

      setForm({
        possuiKids: data.config.possuiKids,
        possuiChip: data.config.possuiChip,
        possuiPremiacaoDinheiro: data.config.possuiPremiacaoDinheiro,
        tempoLimiteMinutos: String(data.config.tempoLimiteMinutos),
        plataformaInscricao: data.config.plataformaInscricao,
        valorInscricao: data.config.valorInscricao,
        limiteVagas: String(data.config.limiteVagas),
        emailContato: data.config.emailContato,
        whatsappContato: data.config.whatsappContato,
        dataInicioInscricao: data.config.dataInicioInscricao.slice(0, 10),
        dataFimInscricao: data.config.dataFimInscricao.slice(0, 10),
      });
    }

    void loadConfig();
  }, [selectedEventId]);

  function togglePlatform(platform: string) {
    setForm((prev) => {
      const has = prev.plataformaInscricao.includes(platform);
      return {
        ...prev,
        plataformaInscricao: has
          ? prev.plataformaInscricao.filter((item) => item !== platform)
          : [...prev.plataformaInscricao, platform],
      };
    });
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEventId) {
      setError("Selecione um evento");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/regulation-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: selectedEventId,
        possuiKids: form.possuiKids,
        possuiChip: form.possuiChip,
        possuiPremiacaoDinheiro: form.possuiPremiacaoDinheiro,
        tempoLimiteMinutos: Number(form.tempoLimiteMinutos),
        plataformaInscricao: form.plataformaInscricao,
        valorInscricao: Number(form.valorInscricao),
        limiteVagas: Number(form.limiteVagas),
        emailContato: form.emailContato,
        whatsappContato: form.whatsappContato,
        dataInicioInscricao: form.dataInicioInscricao,
        dataFimInscricao: form.dataFimInscricao,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar");
      setSaving(false);
      return;
    }

    setSuccess("Regulamento salvo com sucesso");
    setSaving(false);
  }

  const previewText = useMemo(() => {
    if (!selectedEvent) {
      return "Selecione um evento para gerar o preview do regulamento.";
    }

    return generateRegulationText(
      {
        id: "preview",
        eventId: selectedEvent.id,
        possuiKids: form.possuiKids,
        possuiChip: form.possuiChip,
        possuiPremiacaoDinheiro: form.possuiPremiacaoDinheiro,
        tempoLimiteMinutos: Number(form.tempoLimiteMinutos || 0),
        plataformaInscricao: form.plataformaInscricao,
        valorInscricao: form.valorInscricao || "0",
        limiteVagas: Number(form.limiteVagas || 0),
        emailContato: form.emailContato || "contato@evento.com",
        whatsappContato: form.whatsappContato || "(00) 00000-0000",
        dataInicioInscricao: form.dataInicioInscricao || new Date().toISOString(),
        dataFimInscricao: form.dataFimInscricao || new Date().toISOString(),
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: selectedEvent.id,
        nomeEvento: selectedEvent.nomeEvento,
        dataEvento: selectedEvent.dataEvento,
        cidade: selectedEvent.cidade,
        estado: selectedEvent.estado,
        localLargada: selectedEvent.localLargada,
        organizador: selectedEvent.organizador,
      },
    );
  }, [form, selectedEvent]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm text-zinc-600">Carregando modulo de regulamento...</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <div>
        <h2 className="text-3xl font-heading text-zinc-900">Regulamento</h2>
        <p className="text-sm text-zinc-600">Quiz em etapas com geração automática de texto.</p>
      </div>

      <form onSubmit={handleSave} className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface-muted/50 p-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
              Evento
            </label>
            <select
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.nomeEvento} - {event.cidade}/{event.estado}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-border p-4">
            <div className="mb-4 flex flex-wrap gap-2">
              {steps.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium ${
                    step === index
                      ? "bg-accent text-white"
                      : "bg-surface-muted text-zinc-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {step === 0 && (
              <div className="space-y-2 text-sm text-zinc-700">
                <p>
                  Evento: <strong>{selectedEvent?.nomeEvento ?? "-"}</strong>
                </p>
                <p>
                  Data:{" "}
                  <strong>
                    {selectedEvent
                      ? new Date(selectedEvent.dataEvento).toLocaleDateString("pt-BR")
                      : "-"}
                  </strong>
                </p>
                <p>
                  Cidade:{" "}
                  <strong>
                    {selectedEvent ? `${selectedEvent.cidade}/${selectedEvent.estado}` : "-"}
                  </strong>
                </p>
                <p>
                  Organizador: <strong>{selectedEvent?.organizador ?? "-"}</strong>
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={form.possuiKids}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, possuiKids: event.target.checked }))
                    }
                  />
                  Possui corrida kids
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={form.possuiChip}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, possuiChip: event.target.checked }))
                    }
                  />
                  Possui chip de cronometragem
                </label>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    Tempo limite (minutos)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.tempoLimiteMinutos}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        tempoLimiteMinutos: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    Plataformas de inscrição
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {platformOptions.map((platform) => (
                      <label key={platform} className="flex items-center gap-2 text-sm text-zinc-700">
                        <input
                          type="checkbox"
                          checked={form.plataformaInscricao.includes(platform)}
                          onChange={() => togglePlatform(platform)}
                        />
                        {platform}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    Valor inscrição
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.valorInscricao}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, valorInscricao: event.target.value }))
                      }
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                      Limite de vagas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.limiteVagas}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, limiteVagas: event.target.value }))
                      }
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                      Início inscrição
                    </label>
                    <input
                      type="date"
                      value={form.dataInicioInscricao}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          dataInicioInscricao: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                      Fim inscrição
                    </label>
                    <input
                      type="date"
                      value={form.dataFimInscricao}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, dataFimInscricao: event.target.value }))
                      }
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2 text-sm text-zinc-700">
                <p>Configuração de kit com base nos recursos do evento:</p>
                <p>
                  Chip incluso: <strong>{form.possuiChip ? "Sim" : "Não"}</strong>
                </p>
                <p>Número de peito e itens promocionais poderão ser ajustados na versão final.</p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={form.possuiPremiacaoDinheiro}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        possuiPremiacaoDinheiro: event.target.checked,
                      }))
                    }
                  />
                  Possui premiação em dinheiro
                </label>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    E-mail de contato
                  </label>
                  <input
                    type="email"
                    value={form.emailContato}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, emailContato: event.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    WhatsApp de contato
                  </label>
                  <input
                    value={form.whatsappContato}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, whatsappContato: event.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep((prev) => Math.max(0, prev - 1))}
                className="rounded-lg border border-border px-3 py-2 text-sm text-zinc-700 disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={step === steps.length - 1}
                onClick={() => setStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="rounded-lg border border-border px-3 py-2 text-sm text-zinc-700 disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-700">{success}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70"
            >
              {saving ? "Salvando..." : "Salvar regulamento"}
            </button>
            <a
              href={selectedEventId ? `/api/regulation/export?eventId=${selectedEventId}` : "#"}
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm font-semibold text-zinc-700"
            >
              Exportar PDF
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
          <h3 className="text-xl font-heading text-zinc-900">Preview do regulamento</h3>
          <pre className="mt-3 max-h-[780px] overflow-auto whitespace-pre-wrap font-sans text-sm leading-6 text-zinc-800">
            {previewText}
          </pre>
        </div>
      </form>
    </section>
  );
}
