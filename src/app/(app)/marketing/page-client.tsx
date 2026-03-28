"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useUiFeedback } from "@/components/ui-feedback-provider";
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
  const { confirm, showToast } = useUiFeedback();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [packages, setPackages] = useState<MarketingPackageDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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

  const activePackages = useMemo(() => packages.filter((item) => item.ativo).length, [packages]);

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
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

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
      showToast({
        tone: "error",
        title: "Falha ao salvar pacote",
      });
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
    } else {
      const data = (await response.json()) as { package: MarketingPackageDto };
      setPackages((prev) => [...prev, data.package].sort((a, b) => a.ordem - b.ordem));
    }

    setSaving(false);
    resetForm();
    showToast({
      tone: "success",
      title: editingId ? "Pacote atualizado" : "Pacote criado",
      message: "A proposta comercial foi atualizada com sucesso.",
    });
  }

  async function handleDelete(id: string) {
    const pkg = packages.find((item) => item.id === id);
    if (!pkg) return;

    const confirmed = await confirm({
      title: "Remover pacote comercial",
      description: `Deseja remover o pacote ${pkg.nome}?`,
      confirmLabel: "Remover pacote",
      cancelLabel: "Voltar",
      tone: "danger",
    });

    if (!confirmed) return;

    const response = await fetch(`/api/marketing-packages/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Não foi possível remover o pacote.");
      showToast({
        tone: "error",
        title: "Falha ao remover pacote",
      });
      return;
    }

    setPackages((prev) => prev.filter((item) => item.id !== id));
    showToast({ tone: "success", title: "Pacote removido" });
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#ffffff_0%,#fff9f5_48%,#f2f7ff_100%)] p-8 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Marketing
        </p>
        <h2 className="mt-3 text-4xl font-heading text-slate-950">Proposta comercial mais clara</h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-600">
          Ajuste pacotes, entregáveis e cronograma com uma estrutura mais fácil de vender e
          manter.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[32px] border border-border bg-surface p-6 shadow-sm"
        >
          <div>
            <h3 className="text-2xl font-heading text-slate-950">
              {editingId ? "Editar pacote" : "Novo pacote"}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Estruture a oferta com nome, proposta de valor, entregáveis e cronograma.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              Estrutura sugerida
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Apresentação", "Entregáveis", "Mídia", "Pós-evento"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <input
            value={form.nome}
            onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
            placeholder="Nome do pacote"
            className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />

          <textarea
            rows={3}
            value={form.descricao}
            onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
            placeholder="Descrição comercial"
            className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />

          <textarea
            rows={5}
            value={form.entregaveis}
            onChange={(event) => setForm((prev) => ({ ...prev, entregaveis: event.target.value }))}
            placeholder="Entregáveis, um por linha"
            className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.investimento}
              onChange={(event) => setForm((prev) => ({ ...prev, investimento: event.target.value }))}
              placeholder="Investimento"
              className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="number"
              min="0"
              value={form.ordem}
              onChange={(event) => setForm((prev) => ({ ...prev, ordem: event.target.value }))}
              placeholder="Ordem"
              className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <textarea
            rows={4}
            value={form.cronograma}
            onChange={(event) => setForm((prev) => ({ ...prev, cronograma: event.target.value }))}
            placeholder="Cronograma comercial"
            className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />

          <label className="flex items-center gap-2 rounded-2xl border border-border bg-surface-muted/70 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(event) => setForm((prev) => ({ ...prev, ativo: event.target.checked }))}
            />
            Pacote ativo
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Salvando..." : editingId ? "Salvar pacote" : "Criar pacote"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-slate-700"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Evento para proposta
                </label>
                <select
                  value={selectedEventId}
                  onChange={(event) => setSelectedEventId(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
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
              <p className="mt-4 text-sm text-slate-600">Carregando eventos...</p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <QuickCard label="Evento ativo" value={selectedEvent?.nomeEvento ?? "-"} />
                <QuickCard label="Pacotes ativos" value={String(activePackages)} />
                <QuickCard label="Total de pacotes" value={String(packages.length)} />
              </div>
            )}
          </div>

          {packages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-surface p-8 text-sm text-slate-600 shadow-sm">
              Nenhum pacote comercial cadastrado ainda. Use o formulário ao lado para criar a
              primeira oferta.
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              {packages.map((pkg) => (
                <article
                  key={pkg.id}
                  className="rounded-3xl border border-border bg-surface p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-heading text-slate-950">Pacote {pkg.nome}</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {pkg.descricao ?? "Sem descrição"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        pkg.ativo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {pkg.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {pkg.entregaveis.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>

                  <p className="mt-4 text-sm text-slate-500">Investimento sugerido</p>
                  <p className="text-2xl font-heading text-slate-950">
                    {Number(pkg.investimento).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>

                  <p className="mt-4 text-sm text-slate-600">
                    <strong>Cronograma:</strong> {pkg.cronograma ?? "Não informado"}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(pkg)}
                      className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-slate-700"
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
          )}

          <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="text-xl font-heading text-slate-950">Como conduzir a proposta</h3>
            <ol className="mt-4 space-y-2 text-sm text-slate-700">
              <li>1. Comece pelo objetivo comercial do evento e pelo cenário atual da prova.</li>
              <li>2. Escolha o pacote mais adequado e ajuste os entregáveis para a realidade do cliente.</li>
              <li>3. Feche com cronograma, investimento e próximo ponto de decisão.</li>
            </ol>
          </article>
        </div>
      </div>
    </section>
  );
}

function QuickCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
      <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-heading text-slate-950">{value}</p>
    </div>
  );
}
