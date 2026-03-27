"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { EventDto } from "@/modules/events/types";
import { MarketingPackageDto } from "@/modules/marketing/types";

type PackageForm = {
  nome: string;
  descricao: string;
  entregaveis: string;
  investimento: string;
  cronograma: string;
  ativo: boolean;
  ordem: string;
};

const initialForm: PackageForm = {
  nome: "",
  descricao: "",
  entregaveis: "",
  investimento: "",
  cronograma: "",
  ativo: true,
  ordem: "100",
};

export default function MarketingPageClient() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [packages, setPackages] = useState<MarketingPackageDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PackageForm>(initialForm);

  useEffect(() => {
    async function loadBase() {
      setLoading(true);
      const [eventsResponse, packagesResponse] = await Promise.all([
        fetch("/api/events", { cache: "no-store" }),
        fetch("/api/marketing-packages", { cache: "no-store" }),
      ]);

      if (!eventsResponse.ok || !packagesResponse.ok) {
        setError("Não foi possível carregar marketing e eventos.");
        setLoading(false);
        return;
      }

      const eventsData = (await eventsResponse.json()) as { events: EventDto[] };
      const packagesData = (await packagesResponse.json()) as { packages: MarketingPackageDto[] };
      setEvents(eventsData.events);
      setPackages(packagesData.packages);
      setSelectedEventId(eventsData.events[0]?.id ?? "");
      setLoading(false);
    }

    void loadBase();
  }, []);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId],
  );

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function startEdit(pkg: MarketingPackageDto) {
    setEditingId(pkg.id);
    setForm({
      nome: pkg.nome,
      descricao: pkg.descricao ?? "",
      entregaveis: pkg.entregaveis.join("\n"),
      investimento: pkg.investimento,
      cronograma: pkg.cronograma ?? "",
      ativo: pkg.ativo,
      ordem: String(pkg.ordem),
    });
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const deliverables = form.entregaveis
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/marketing-packages/${editingId}` : "/api/marketing-packages";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: form.nome,
        descricao: form.descricao || null,
        entregaveis: deliverables,
        investimento: Number(form.investimento),
        cronograma: form.cronograma || null,
        ativo: form.ativo,
        ordem: Number(form.ordem) || 0,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar o pacote.");
      setSaving(false);
      return;
    }

    if (editingId) {
      setPackages((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                nome: form.nome,
                descricao: form.descricao || null,
                entregaveis: deliverables,
                investimento: form.investimento,
                cronograma: form.cronograma || null,
                ativo: form.ativo,
                ordem: Number(form.ordem) || 0,
              }
            : item,
        ),
      );
      setSuccess("Pacote atualizado.");
    } else {
      const data = (await response.json()) as { package: MarketingPackageDto };
      setPackages((prev) => [...prev, data.package].sort((a, b) => a.ordem - b.ordem));
      setSuccess("Pacote criado.");
    }

    setSaving(false);
    resetForm();
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/marketing-packages/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Não foi possível remover o pacote.");
      return;
    }

    setPackages((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Marketing</p>
        <h2 className="mt-2 text-3xl font-heading text-zinc-900">Proposta comercial para organizadores</h2>
        <p className="mt-2 text-zinc-600">
          Edite pacotes, posicionamento comercial e gere a proposta do evento em PDF.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-sm"
        >
          <div>
            <h3 className="text-2xl font-heading text-zinc-900">
              {editingId ? "Editar pacote" : "Novo pacote"}
            </h3>
          </div>

          <input
            value={form.nome}
            onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
            placeholder="Nome do pacote"
            className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
          />

          <textarea
            rows={3}
            value={form.descricao}
            onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
            placeholder="Descrição comercial"
            className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
          />

          <textarea
            rows={5}
            value={form.entregaveis}
            onChange={(event) => setForm((prev) => ({ ...prev, entregaveis: event.target.value }))}
            placeholder="Entregáveis, um por linha"
            className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.investimento}
              onChange={(event) => setForm((prev) => ({ ...prev, investimento: event.target.value }))}
              placeholder="Investimento"
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="number"
              min="0"
              value={form.ordem}
              onChange={(event) => setForm((prev) => ({ ...prev, ordem: event.target.value }))}
              placeholder="Ordem"
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <textarea
            rows={4}
            value={form.cronograma}
            onChange={(event) => setForm((prev) => ({ ...prev, cronograma: event.target.value }))}
            placeholder="Cronograma comercial"
            className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
          />

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(event) => setForm((prev) => ({ ...prev, ativo: event.target.checked }))}
            />
            Pacote ativo
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-700">{success}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              {saving ? "Salvando..." : editingId ? "Salvar pacote" : "Criar pacote"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-zinc-700"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="space-y-6">
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

          <div className="grid gap-6 xl:grid-cols-2">
            {packages.map((pkg) => (
              <article
                key={pkg.id}
                className="rounded-3xl border border-border bg-surface p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-heading text-zinc-900">Pacote {pkg.nome}</h3>
                    <p className="mt-2 text-sm text-zinc-600">{pkg.descricao ?? "Sem descrição"}</p>
                  </div>
                  <span
                    className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                      pkg.ativo ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {pkg.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <ul className="mt-4 space-y-2 text-sm text-zinc-700">
                  {pkg.entregaveis.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>

                <p className="mt-4 text-sm text-zinc-500">Investimento sugerido</p>
                <p className="text-2xl font-heading text-zinc-900">
                  {Number(pkg.investimento).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>

                <p className="mt-4 text-sm text-zinc-600">
                  <strong>Cronograma:</strong> {pkg.cronograma ?? "Não informado"}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(pkg)}
                    className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-zinc-700"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(pkg.id)}
                    className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600"
                  >
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>

          <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="text-xl font-heading text-zinc-900">Como apresentar ao cliente</h3>
            <ol className="mt-4 space-y-2 text-sm text-zinc-700">
              <li>1. Mostre o objetivo principal do evento e o momento comercial atual.</li>
              <li>2. Selecione o pacote ideal e ajuste entregáveis para a realidade da prova.</li>
              <li>3. Feche com cronograma, investimento e próxima reunião de aprovação.</li>
            </ol>
          </article>
        </div>
      </div>
    </section>
  );
}
