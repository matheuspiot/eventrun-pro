"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CostItemDto } from "../types";

type CostForm = {
  nome: string;
  categoria:
    | "ESTRUTURA"
    | "STAFF"
    | "SEGURANCA"
    | "MATERIAIS"
    | "COMUNICACAO"
    | "TAXAS"
    | "LOGISTICA"
    | "OUTROS";
  tipoCusto: "FIXO" | "VARIAVEL_ATLETA" | "VARIAVEL_UNIDADE";
  unidade: "UN" | "PESSOA" | "HORA" | "KM" | "LOTE" | "ATLETA";
  custoPadrao: string;
  descricao: string;
};

const initialForm: CostForm = {
  nome: "",
  categoria: "ESTRUTURA",
  tipoCusto: "FIXO",
  unidade: "UN",
  custoPadrao: "",
  descricao: "",
};

const categoryLabels: Record<CostForm["categoria"], string> = {
  ESTRUTURA: "Estrutura",
  STAFF: "Staff",
  SEGURANCA: "Segurança",
  MATERIAIS: "Materiais",
  COMUNICACAO: "Comunicação",
  TAXAS: "Taxas",
  LOGISTICA: "Logística",
  OUTROS: "Outros",
};

export function CostLibrary() {
  const [items, setItems] = useState<CostItemDto[]>([]);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CostForm>(initialForm);

  const title = useMemo(
    () => (editingId ? "Editar custo" : "Novo custo"),
    [editingId],
  );

  const loadItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();

    if (search) {
      params.set("search", search);
    }

    if (categoria) {
      params.set("categoria", categoria);
    }

    const response = await fetch(`/api/cost-items?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      setError("Não foi possível carregar os custos");
      setLoading(false);
      return;
    }

    const data = (await response.json()) as { items: CostItemDto[] };
    setItems(data.items);
    setLoading(false);
  }, [search, categoria]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadItems();
  }, [loadItems]);

  function openCreateModal() {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(item: CostItemDto) {
    setEditingId(item.id);
    setForm({
      nome: item.nome,
      categoria: item.categoria,
      tipoCusto: item.tipoCusto,
      unidade: item.unidade,
      custoPadrao: item.custoPadrao,
      descricao: item.descricao ?? "",
    });
    setError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const url = editingId ? `/api/cost-items/${editingId}` : "/api/cost-items";
    const method = editingId ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        custoPadrao: Number(form.custoPadrao),
        descricao: form.descricao || null,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar o custo");
      return;
    }

    setIsModalOpen(false);
    await loadItems();
    window.dispatchEvent(new Event("eventrun:cost-items-updated"));
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/cost-items/${id}`, { method: "DELETE" });

    if (!response.ok) {
      setError("Não foi possível excluir o custo");
      return;
    }

    await loadItems();
    window.dispatchEvent(new Event("eventrun:cost-items-updated"));
  }

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-heading text-zinc-900">Biblioteca de Custos</h2>
          <p className="text-sm text-zinc-600">
            Liste, pesquise e gerencie custos padrão por categoria.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Novo Custo
        </button>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome"
          className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        />
        <select
          value={categoria}
          onChange={(event) => setCategoria(event.target.value)}
          className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Todas as categorias</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-zinc-500">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Unidade</th>
              <th className="px-3 py-2">Custo Padrão</th>
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                  Carregando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                  Nenhum custo cadastrado.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-border/80">
                  <td className="px-3 py-3 font-medium text-zinc-900">{item.nome}</td>
                  <td className="px-3 py-3 text-zinc-600">{categoryLabels[item.categoria]}</td>
                  <td className="px-3 py-3 text-zinc-600">{item.tipoCusto.replace("_", " ")}</td>
                  <td className="px-3 py-3 text-zinc-600">{item.unidade}</td>
                  <td className="px-3 py-3 text-zinc-600">
                    {Number(item.custoPadrao).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-zinc-700"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-heading text-zinc-900">{title}</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-border px-3 py-1 text-sm text-zinc-700"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <input
                required
                value={form.nome}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, nome: event.target.value }))
                }
                placeholder="Nome do custo"
                className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={form.categoria}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      categoria: event.target.value as CostForm["categoria"],
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={form.tipoCusto}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      tipoCusto: event.target.value as CostForm["tipoCusto"],
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="FIXO">Fixo</option>
                  <option value="VARIAVEL_ATLETA">Variável atleta</option>
                  <option value="VARIAVEL_UNIDADE">Variável unidade</option>
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={form.unidade}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      unidade: event.target.value as CostForm["unidade"],
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="UN">un</option>
                  <option value="PESSOA">pessoa</option>
                  <option value="HORA">hora</option>
                  <option value="KM">km</option>
                  <option value="LOTE">lote</option>
                  <option value="ATLETA">atleta</option>
                </select>

                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.custoPadrao}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, custoPadrao: event.target.value }))
                  }
                  placeholder="Custo padrão"
                  className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <textarea
                rows={3}
                value={form.descricao}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, descricao: event.target.value }))
                }
                placeholder="Descrição (opcional)"
                className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                {editingId ? "Salvar alterações" : "Cadastrar custo"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
