"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { EventDto } from "@/modules/events/types";

type EventPayload = {
  nomeEvento: string;
  dataEvento: string;
  cidade: string;
  estado: string;
  localLargada: string;
  organizador: string;
  cnpjOrganizador: string;
  modalidades: string;
  distancias: string;
  capacidadeMaxima: string;
  limiteTecnico: string;
  cronogramaResumo: string;
  patrocinadores: string;
  fornecedores: string;
  status: "PLANEJAMENTO" | "EM_ANDAMENTO" | "FINALIZADO";
};

const initialForm: EventPayload = {
  nomeEvento: "",
  dataEvento: "",
  cidade: "",
  estado: "",
  localLargada: "",
  organizador: "",
  cnpjOrganizador: "",
  modalidades: "",
  distancias: "",
  capacidadeMaxima: "",
  limiteTecnico: "",
  cronogramaResumo: "",
  patrocinadores: "",
  fornecedores: "",
  status: "PLANEJAMENTO",
};

function summarize(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value.length > 60 ? `${value.slice(0, 60)}...` : value;
}

export function EventsManager() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [form, setForm] = useState<EventPayload>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const buttonLabel = useMemo(
    () => (editingId ? "Salvar projeto" : "Criar novo projeto"),
    [editingId],
  );

  async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  const loadEvents = useCallback(async (showLoading = true) => {
    try {
      setError("");
      if (showLoading) {
        setLoading(true);
      }
      const response = await fetchWithTimeout("/api/events", { cache: "no-store" });

      if (!response.ok) {
        setError("Não foi possível carregar os projetos.");
        setLoading(false);
        return;
      }

      const data = (await response.json()) as { events?: EventDto[] };
      setEvents(Array.isArray(data.events) ? data.events : []);
      setLoading(false);
    } catch {
      setError("Falha de conexão ao carregar projetos.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents(false);
  }, [loadEvents]);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const url = editingId ? `/api/events/${editingId}` : "/api/events";
    const method = editingId ? "PATCH" : "POST";

    try {
      const response = await fetchWithTimeout(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          capacidadeMaxima: form.capacidadeMaxima ? Number(form.capacidadeMaxima) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Não foi possível salvar o projeto.");
        return;
      }

      resetForm();
      await loadEvents();
    } catch {
      setError("Falha de conexão ao salvar projeto.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetchWithTimeout(`/api/events/${id}`, { method: "DELETE" });

      if (!response.ok) {
        setError("Não foi possível remover o projeto.");
        return;
      }

      await loadEvents();
    } catch {
      setError("Falha de conexão ao remover projeto.");
    }
  }

  function handleEdit(event: EventDto) {
    setEditingId(event.id);
    setForm({
      nomeEvento: event.nomeEvento,
      dataEvento: event.dataEvento.slice(0, 10),
      cidade: event.cidade,
      estado: event.estado,
      localLargada: event.localLargada,
      organizador: event.organizador,
      cnpjOrganizador: event.cnpjOrganizador,
      modalidades: event.modalidades ?? "",
      distancias: event.distancias ?? "",
      capacidadeMaxima: event.capacidadeMaxima ? String(event.capacidadeMaxima) : "",
      limiteTecnico: event.limiteTecnico ?? "",
      cronogramaResumo: event.cronogramaResumo ?? "",
      patrocinadores: event.patrocinadores ?? "",
      fornecedores: event.fornecedores ?? "",
      status: event.status,
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-sm"
      >
        <div>
          <h3 className="text-2xl font-heading text-zinc-900">
            {editingId ? "Editar projeto" : "Criar projeto"}
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            Cadastre dados operacionais para melhorar o planejamento do evento.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-muted/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
            Identificação
          </p>
          <div className="mt-3 space-y-3">
            <input
              required
              value={form.nomeEvento}
              onChange={(event) => setForm((prev) => ({ ...prev, nomeEvento: event.target.value }))}
              placeholder="Nome do evento"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />

            <input
              type="date"
              required
              value={form.dataEvento}
              onChange={(event) => setForm((prev) => ({ ...prev, dataEvento: event.target.value }))}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                required
                value={form.cidade}
                onChange={(event) => setForm((prev) => ({ ...prev, cidade: event.target.value }))}
                placeholder="Cidade"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                required
                value={form.estado}
                onChange={(event) => setForm((prev) => ({ ...prev, estado: event.target.value }))}
                placeholder="Estado"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <input
              required
              value={form.localLargada}
              onChange={(event) => setForm((prev) => ({ ...prev, localLargada: event.target.value }))}
              placeholder="Local de largada"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-muted/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
            Operação
          </p>
          <div className="mt-3 space-y-3">
            <input
              value={form.modalidades}
              onChange={(event) => setForm((prev) => ({ ...prev, modalidades: event.target.value }))}
              placeholder="Modalidades (ex.: corrida, caminhada, kids)"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />

            <input
              value={form.distancias}
              onChange={(event) => setForm((prev) => ({ ...prev, distancias: event.target.value }))}
              placeholder="Distâncias (ex.: 5K, 10K, 21K)"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="number"
                min="1"
                value={form.capacidadeMaxima}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, capacidadeMaxima: event.target.value }))
                }
                placeholder="Capacidade máxima"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                value={form.limiteTecnico}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, limiteTecnico: event.target.value }))
                }
                placeholder="Limite técnico"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <textarea
              rows={4}
              value={form.cronogramaResumo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, cronogramaResumo: event.target.value }))
              }
              placeholder="Cronograma principal do evento"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-muted/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
            Organização
          </p>
          <div className="mt-3 space-y-3">
            <input
              required
              value={form.organizador}
              onChange={(event) => setForm((prev) => ({ ...prev, organizador: event.target.value }))}
              placeholder="Organizador"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              required
              value={form.cnpjOrganizador}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, cnpjOrganizador: event.target.value }))
              }
              placeholder="CNPJ do organizador"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              value={form.patrocinadores}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, patrocinadores: event.target.value }))
              }
              placeholder="Patrocinadores principais"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              value={form.fornecedores}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, fornecedores: event.target.value }))
              }
              placeholder="Fornecedores principais"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <select
          value={form.status}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              status: event.target.value as EventPayload["status"],
            }))
          }
          className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="PLANEJAMENTO">Planejamento</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="FINALIZADO">Finalizado</option>
        </select>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Salvando..." : buttonLabel}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm font-medium text-zinc-700"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-2xl font-heading text-zinc-900">Lista de projetos</h3>
            <p className="mt-1 text-sm text-zinc-600">
              Cada evento agora guarda dados operacionais para execução e venda.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-zinc-600">Carregando...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface-muted p-6 text-center text-zinc-500">
                Nenhum projeto cadastrado ainda.
              </div>
            ) : (
              events.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-border bg-surface-muted/60 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h4 className="text-xl font-heading text-zinc-900">{item.nomeEvento}</h4>
                      <p className="text-sm text-zinc-600">
                        {new Date(item.dataEvento).toLocaleDateString("pt-BR")} - {item.cidade}/
                        {item.estado}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-zinc-700"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600"
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoCard label="Status" value={item.status.replace("_", " ")} />
                    <InfoCard
                      label="Modalidades"
                      value={summarize(item.modalidades, "Não informado")}
                    />
                    <InfoCard
                      label="Distâncias"
                      value={summarize(item.distancias, "Não informado")}
                    />
                    <InfoCard
                      label="Capacidade"
                      value={item.capacidadeMaxima ? `${item.capacidadeMaxima} atletas` : "Não informado"}
                    />
                    <InfoCard
                      label="Limite técnico"
                      value={summarize(item.limiteTecnico, "Não informado")}
                    />
                    <InfoCard
                      label="Patrocinadores"
                      value={summarize(item.patrocinadores, "Não informado")}
                    />
                    <InfoCard
                      label="Fornecedores"
                      value={summarize(item.fornecedores, "Não informado")}
                    />
                    <InfoCard
                      label="Cronograma"
                      value={summarize(item.cronogramaResumo, "Não informado")}
                    />
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">{label}</p>
      <p className="mt-2 text-sm text-zinc-800">{value}</p>
    </div>
  );
}
