"use client";

import { FormEvent, useState } from "react";

type Props = {
  initialUserName: string;
  initialEmail: string;
  initialOrganizationName: string;
  createdAt: string;
};

export function SettingsEditor({
  initialUserName,
  initialEmail,
  initialOrganizationName,
  createdAt,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [userName, setUserName] = useState(initialUserName);
  const [organizationName, setOrganizationName] = useState(initialOrganizationName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName,
        organizationName,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Nao foi possivel salvar as configuracoes.");
      setSaving(false);
      return;
    }

    setSuccess("Configuracoes salvas com sucesso.");
    setEditing(false);
    setSaving(false);
  }

  function handleCancel() {
    setUserName(initialUserName);
    setOrganizationName(initialOrganizationName);
    setEditing(false);
    setError("");
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Configuracoes
        </p>
        <h2 className="mt-2 text-3xl font-heading text-zinc-900">
          Preferencias da organizacao
        </h2>
        <p className="mt-2 text-zinc-600">
          Ajuste os dados principais da conta e mantenha sua operacao atualizada.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-xl font-heading text-zinc-900">Conta</h3>
          <div className="mt-4 space-y-3 text-sm">
            <label className="block">
              <span className="mb-1 block text-zinc-500">Usuario</span>
              <input
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                disabled={!editing}
                className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none disabled:opacity-80"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-zinc-500">E-mail</span>
              <input
                value={initialEmail}
                disabled
                className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 opacity-80"
              />
            </label>
            <p className="text-zinc-500">Criada em: {new Date(createdAt).toLocaleDateString("pt-BR")}</p>
          </div>
        </article>

        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-xl font-heading text-zinc-900">Organizacao</h3>
          <label className="mt-4 block text-sm">
            <span className="mb-1 block text-zinc-500">Nome da organizacao</span>
            <input
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              disabled={!editing}
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none disabled:opacity-80"
            />
          </label>
        </article>

        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-xl font-heading text-zinc-900">Acoes</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
              >
                Editar dados
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {saving ? "Salvando..." : "Salvar alteracoes"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-zinc-700"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-3 text-sm text-emerald-700">{success}</p>}
        </article>
      </form>
    </section>
  );
}
