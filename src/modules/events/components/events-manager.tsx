"use client";

import { EventDto } from "@/modules/events/types";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type EventPayload = {
  nomeEvento: string;
  dataEvento: string;
  cidade: string;
  estado: string;
  localLargada: string;
  organizador: string;
  cnpjOrganizador: string;
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
  status: "PLANEJAMENTO",
};

export function EventsManager() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [form, setForm] = useState<EventPayload>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const buttonLabel = useMemo(() => (editingId ? "Salvar projeto" : "Criar novo projeto"), [editingId]);
  const [submitting, setSubmitting] = useState(false);

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
        setError("Não foi possível carregar os projetos");
        setLoading(false);
        return;
      }

      const data = (await response.json()) as { events?: EventDto[] };
      setEvents(Array.isArray(data.events) ? data.events : []);
      setLoading(false);
    } catch {
      setError("Falha de conexão ao carregar projetos");
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
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Não foi possível salvar o projeto");
        return;
      }

      resetForm();
      await loadEvents();
    } catch {
      setError("Falha de conexão ao salvar projeto");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetchWithTimeout(`/api/events/${id}`, { method: "DELETE" });

      if (!response.ok) {
        setError("Não foi possível remover o projeto");
        return;
      }

      await loadEvents();
    } catch {
      setError("Falha de conexão ao remover projeto");
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
      status: event.status,
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <form onSubmit={handleSubmit} className="space-y-3 rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="text-2xl font-heading text-zinc-900">{editingId ? "Editar projeto" : "Criar projeto"}</h3>

        <input
          required
          value={form.nomeEvento}
          onChange={(event) => setForm((prev) => ({ ...prev, nomeEvento: event.target.value }))}
          placeholder="Nome do evento"
          className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        />

        <input
          type="date"
          required
          value={form.dataEvento}
          onChange={(event) => setForm((prev) => ({ ...prev, dataEvento: event.target.value }))}
          className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            required
            value={form.cidade}
            onChange={(event) => setForm((prev) => ({ ...prev, cidade: event.target.value }))}
            placeholder="Cidade"
            className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            required
            value={form.estado}
            onChange={(event) => setForm((prev) => ({ ...prev, estado: event.target.value }))}
            placeholder="Estado"
            className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <input
          required
          value={form.localLargada}
          onChange={(event) => setForm((prev) => ({ ...prev, localLargada: event.target.value }))}
          placeholder="Local de largada"
          className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          required
          value={form.organizador}
          onChange={(event) => setForm((prev) => ({ ...prev, organizador: event.target.value }))}
          placeholder="Organizador"
          className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          required
          value={form.cnpjOrganizador}
          onChange={(event) => setForm((prev) => ({ ...prev, cnpjOrganizador: event.target.value }))}
          placeholder="CNPJ do organizador"
          className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        />

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
        <h3 className="text-2xl font-heading text-zinc-900">Lista de projetos</h3>
        {loading ? (
          <p className="mt-4 text-sm text-zinc-600">Carregando...</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-zinc-500">
                  <th className="px-3 py-2">Nome do evento</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Cidade</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {events.map((item) => (
                  <tr key={item.id} className="border-b border-border/80">
                    <td className="px-3 py-3 font-medium text-zinc-900">{item.nomeEvento}</td>
                    <td className="px-3 py-3 text-zinc-600">{new Date(item.dataEvento).toLocaleDateString("pt-BR")}</td>
                    <td className="px-3 py-3 text-zinc-600">{item.cidade}</td>
                    <td className="px-3 py-3 text-zinc-600">{item.status.replace("_", " ")}</td>
                    <td className="px-3 py-3">
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
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                      Nenhum projeto cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

