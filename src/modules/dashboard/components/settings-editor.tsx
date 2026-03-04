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
  const [savedUserName, setSavedUserName] = useState(initialUserName);
  const [savedOrganizationName, setSavedOrganizationName] = useState(initialOrganizationName);
  const [userName, setUserName] = useState(initialUserName);
  const [organizationName, setOrganizationName] = useState(initialOrganizationName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const hasChanges =
    userName.trim() !== savedUserName.trim() ||
    organizationName.trim() !== savedOrganizationName.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const nextUserName = userName.trim();
    const nextOrganizationName = organizationName.trim();
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: nextUserName,
        organizationName: nextOrganizationName,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar as configurações.");
      setSaving(false);
      return;
    }

    setSavedUserName(nextUserName);
    setSavedOrganizationName(nextOrganizationName);
    setUserName(nextUserName);
    setOrganizationName(nextOrganizationName);
    setSuccess("Configurações salvas com sucesso.");
    setEditing(false);
    setSaving(false);
  }

  function handleCancel() {
    setUserName(savedUserName);
    setOrganizationName(savedOrganizationName);
    setEditing(false);
    setError("");
    setSuccess("");
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Configurações
        </p>
        <h2 className="mt-2 text-3xl font-heading text-zinc-900">
          Preferências da organização
        </h2>
        <p className="mt-2 text-zinc-600">
          Ajuste os dados principais da conta e mantenha sua operação atualizada.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-lg px-3 py-1 text-xs font-semibold ${
              editing ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {editing ? "Modo edição ativo" : "Modo visualização"}
          </span>
          {!editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setSuccess("");
                setError("");
              }}
              className="rounded-lg border border-border bg-surface px-3 py-1 text-xs font-semibold text-zinc-700"
            >
              Editar dados
            </button>
          )}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-xl font-heading text-zinc-900">Conta</h3>
          <div className="mt-4 space-y-3 text-sm">
            <label className="block">
              <span className="mb-1 block text-zinc-500">Usuário</span>
              <input
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                disabled={!editing}
                className={`w-full rounded-xl border px-3 py-2 outline-none ${
                  editing
                    ? "border-accent/40 bg-white focus:ring-2 focus:ring-accent"
                    : "border-border bg-surface-muted disabled:opacity-80"
                }`}
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
          <h3 className="text-xl font-heading text-zinc-900">Organização</h3>
          <label className="mt-4 block text-sm">
            <span className="mb-1 block text-zinc-500">Nome da organização</span>
            <input
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              disabled={!editing}
              className={`w-full rounded-xl border px-3 py-2 outline-none ${
                editing
                  ? "border-accent/40 bg-white focus:ring-2 focus:ring-accent"
                  : "border-border bg-surface-muted disabled:opacity-80"
              }`}
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
                  disabled={saving || !hasChanges}
                  className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {saving ? "Salvando..." : "Salvar alterações"}
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
          {editing && !hasChanges && (
            <p className="mt-3 text-xs text-zinc-500">Faça uma alteração para habilitar o salvamento.</p>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-3 text-sm text-emerald-700">{success}</p>}
        </article>
      </form>
    </section>
  );
}
