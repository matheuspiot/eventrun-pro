"use client";

import { FormEvent, useState } from "react";
import { UserRole } from "@/lib/auth";
import { OrganizationUserDto } from "@/modules/users/types";

type Props = {
  initialUserName: string;
  initialEmail: string;
  initialUserRole: UserRole;
  initialOrganizationName: string;
  createdAt: string;
  initialUsers: OrganizationUserDto[];
};

type NewUserForm = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "ADMIN", label: "Administrador" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "OPERACIONAL", label: "Operacional" },
  { value: "MARKETING", label: "Marketing" },
];

const initialNewUserForm: NewUserForm = {
  name: "",
  email: "",
  password: "",
  role: "OPERACIONAL",
};

export function SettingsEditor({
  initialUserName,
  initialEmail,
  initialUserRole,
  initialOrganizationName,
  createdAt,
  initialUsers,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [savedUserName, setSavedUserName] = useState(initialUserName);
  const [savedOrganizationName, setSavedOrganizationName] = useState(initialOrganizationName);
  const [userName, setUserName] = useState(initialUserName);
  const [organizationName, setOrganizationName] = useState(initialOrganizationName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [users, setUsers] = useState(initialUsers);
  const [userForm, setUserForm] = useState<NewUserForm>(initialNewUserForm);
  const [usersSaving, setUsersSaving] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [usersSuccess, setUsersSuccess] = useState("");

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
      setError(data.error ?? "Nao foi possivel salvar as configuracoes.");
      setSaving(false);
      return;
    }

    setSavedUserName(nextUserName);
    setSavedOrganizationName(nextOrganizationName);
    setUserName(nextUserName);
    setOrganizationName(nextOrganizationName);
    setSuccess("Configuracoes salvas com sucesso.");
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

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUsersSaving(true);
    setUsersError("");
    setUsersSuccess("");

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userForm),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setUsersError(data.error ?? "Nao foi possivel criar o usuario.");
      setUsersSaving(false);
      return;
    }

    const data = (await response.json()) as { user: OrganizationUserDto };
    setUsers((prev) => [...prev, data.user].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
    setUserForm(initialNewUserForm);
    setUsersSuccess("Usuario criado com sucesso.");
    setUsersSaving(false);
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    setUsersSaving(true);
    setUsersError("");
    setUsersSuccess("");

    const response = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setUsersError(data.error ?? "Nao foi possivel atualizar o papel.");
      setUsersSaving(false);
      return;
    }

    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role } : user)));
    setUsersSuccess("Permissao atualizada.");
    setUsersSaving(false);
  }

  async function handleDeleteUser(userId: string) {
    setUsersSaving(true);
    setUsersError("");
    setUsersSuccess("");

    const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setUsersError(data.error ?? "Nao foi possivel remover o usuario.");
      setUsersSaving(false);
      return;
    }

    setUsers((prev) => prev.filter((user) => user.id !== userId));
    setUsersSuccess("Usuario removido.");
    setUsersSaving(false);
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
          Ajuste os dados principais da conta, controle papeis e mantenha sua operacao atualizada.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-lg px-3 py-1 text-xs font-semibold ${
              editing ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {editing ? "Modo edicao ativo" : "Modo visualizacao"}
          </span>
          <span className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            Perfil atual: {roleOptions.find((item) => item.value === initialUserRole)?.label}
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
              <span className="mb-1 block text-zinc-500">Usuario</span>
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
            <p className="text-zinc-500">
              Criada em: {new Date(createdAt).toLocaleDateString("pt-BR")}
            </p>
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
          {editing && !hasChanges && (
            <p className="mt-3 text-xs text-zinc-500">
              Faca uma alteracao para habilitar o salvamento.
            </p>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-3 text-sm text-emerald-700">{success}</p>}
        </article>
      </form>

      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleCreateUser}
          className="rounded-3xl border border-border bg-surface p-6 shadow-sm"
        >
          <h3 className="text-xl font-heading text-zinc-900">Novo usuario</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Crie acessos separados por papel para financeiro, operacao e marketing.
          </p>

          <div className="mt-4 space-y-3">
            <input
              value={userForm.name}
              onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nome"
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="email"
              value={userForm.email}
              onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="E-mail"
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="password"
              value={userForm.password}
              onChange={(event) =>
                setUserForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="Senha inicial"
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            />
            <select
              value={userForm.role}
              onChange={(event) =>
                setUserForm((prev) => ({ ...prev, role: event.target.value as UserRole }))
              }
              className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={usersSaving}
            className="mt-4 w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {usersSaving ? "Salvando..." : "Criar usuario"}
          </button>

          {usersError && <p className="mt-3 text-sm text-red-600">{usersError}</p>}
          {usersSuccess && <p className="mt-3 text-sm text-emerald-700">{usersSuccess}</p>}
        </form>

        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-heading text-zinc-900">Usuarios da organizacao</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Cada papel enxerga apenas os modulos autorizados na barra lateral e nas APIs.
              </p>
            </div>
            <span className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              {users.length} usuario(s)
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {users.map((user) => {
              const isCurrentUser = user.email === initialEmail;

              return (
                <div
                  key={user.id}
                  className="grid gap-3 rounded-2xl border border-border bg-surface-muted p-4 md:grid-cols-[1fr_180px_auto]"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">{user.name}</p>
                    <p className="text-sm text-zinc-600">{user.email}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Desde {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      {isCurrentUser ? " • usuario atual" : ""}
                    </p>
                  </div>

                  <select
                    value={user.role}
                    disabled={usersSaving || isCurrentUser}
                    onChange={(event) =>
                      void handleRoleChange(user.id, event.target.value as UserRole)
                    }
                    className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent disabled:opacity-70"
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={usersSaving || isCurrentUser}
                    onClick={() => void handleDeleteUser(user.id)}
                    className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
                  >
                    Remover
                  </button>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </section>
  );
}
