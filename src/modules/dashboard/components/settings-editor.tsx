"use client";

import { FormEvent, useMemo, useState } from "react";
import { UserRole } from "@/lib/auth";
import { useUiFeedback } from "@/components/ui-feedback-provider";
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
  const { confirm, showToast } = useUiFeedback();
  const [editing, setEditing] = useState(false);
  const [savedUserName, setSavedUserName] = useState(initialUserName);
  const [savedOrganizationName, setSavedOrganizationName] = useState(initialOrganizationName);
  const [userName, setUserName] = useState(initialUserName);
  const [organizationName, setOrganizationName] = useState(initialOrganizationName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [users, setUsers] = useState(initialUsers);
  const [userForm, setUserForm] = useState<NewUserForm>(initialNewUserForm);
  const [usersSaving, setUsersSaving] = useState(false);
  const [usersError, setUsersError] = useState("");

  const hasChanges =
    userName.trim() !== savedUserName.trim() ||
    organizationName.trim() !== savedOrganizationName.trim();

  const roleSummary = useMemo(
    () => roleOptions.find((item) => item.value === initialUserRole)?.label ?? "Administrador",
    [initialUserRole],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

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
      showToast({
        tone: "error",
        title: "Falha ao salvar configurações",
        message: "Revise os dados e tente novamente.",
      });
      setSaving(false);
      return;
    }

    setSavedUserName(nextUserName);
    setSavedOrganizationName(nextOrganizationName);
    setUserName(nextUserName);
    setOrganizationName(nextOrganizationName);
    setEditing(false);
    setSaving(false);
    showToast({
      tone: "success",
      title: "Configurações atualizadas",
      message: "Os dados principais da organização foram salvos com sucesso.",
    });
  }

  function handleCancel() {
    setUserName(savedUserName);
    setOrganizationName(savedOrganizationName);
    setEditing(false);
    setError("");
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUsersSaving(true);
    setUsersError("");

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userForm),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setUsersError(data.error ?? "Não foi possível criar o usuário.");
      showToast({
        tone: "error",
        title: "Falha ao criar usuário",
        message: "Confira os campos e tente novamente.",
      });
      setUsersSaving(false);
      return;
    }

    const data = (await response.json()) as { user: OrganizationUserDto };
    setUsers((prev) => [...prev, data.user].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
    setUserForm(initialNewUserForm);
    setUsersSaving(false);
    showToast({
      tone: "success",
      title: "Usuário criado",
      message: `${data.user.name} já pode acessar a organização com o papel selecionado.`,
    });
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    setUsersSaving(true);
    setUsersError("");

    const response = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setUsersError(data.error ?? "Não foi possível atualizar o papel.");
      showToast({
        tone: "error",
        title: "Falha ao atualizar permissão",
        message: "O papel do usuário não foi alterado.",
      });
      setUsersSaving(false);
      return;
    }

    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role } : user)));
    setUsersSaving(false);
    showToast({
      tone: "success",
      title: "Permissão atualizada",
      message: "As novas permissões já estão valendo para esse usuário.",
    });
  }

  async function handleDeleteUser(userId: string) {
    const user = users.find((item) => item.id === userId);
    if (!user) {
      return;
    }

    const confirmed = await confirm({
      title: "Remover usuário",
      description: `Deseja remover ${user.name} da organização? Essa ação não pode ser desfeita por esta tela.`,
      confirmLabel: "Remover usuário",
      cancelLabel: "Voltar",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    setUsersSaving(true);
    setUsersError("");

    const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setUsersError(data.error ?? "Não foi possível remover o usuário.");
      showToast({
        tone: "error",
        title: "Falha ao remover usuário",
        message: "Nenhuma alteração foi aplicada.",
      });
      setUsersSaving(false);
      return;
    }

    setUsers((prev) => prev.filter((item) => item.id !== userId));
    setUsersSaving(false);
    showToast({
      tone: "success",
      title: "Usuário removido",
      message: `${user.name} foi removido da equipe com sucesso.`,
    });
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#ffffff_0%,#fff7f1_48%,#eef6ff_100%)] p-8 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Configurações
        </p>
        <h2 className="mt-3 text-4xl font-heading text-slate-950">
          Conta, equipe e permissões
        </h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-600">
          Centralize dados da organização, ajuste acessos por papel e mantenha a equipe operando
          com clareza.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              editing ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
            }`}
          >
            {editing ? "Modo de edição" : "Modo de visualização"}
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            Perfil atual: {roleSummary}
          </span>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
            Organização criada em {new Date(createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-heading text-slate-950">Dados principais</h3>
              <p className="mt-2 text-sm text-slate-600">
                Edite apenas o que realmente impacta operação e acesso.
              </p>
            </div>
            {!editing ? (
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setError("");
                }}
                className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Editar
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                Usuário principal
              </span>
              <input
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                disabled={!editing}
                className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                  editing
                    ? "border-accent/40 bg-white focus:ring-2 focus:ring-accent"
                    : "border-border bg-surface-muted text-slate-700"
                }`}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                Nome da organização
              </span>
              <input
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                disabled={!editing}
                className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                  editing
                    ? "border-accent/40 bg-white focus:ring-2 focus:ring-accent"
                    : "border-border bg-surface-muted text-slate-700"
                }`}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                E-mail
              </span>
              <input
                value={initialEmail}
                disabled
                className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 text-slate-500"
              />
            </label>
          </div>

          {editing ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface-muted/70 px-4 py-3 text-sm text-slate-600">
              Entre em modo de edição para alterar os dados da conta e da organização.
            </div>
          )}

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </article>

        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-2xl font-heading text-slate-950">Leitura rápida</h3>
          <div className="mt-5 space-y-3">
            <InfoCard
              label="Estrutura da conta"
              value="Um administrador centraliza permissões e dados principais da organização."
            />
            <InfoCard
              label="Papéis da equipe"
              value="Financeiro, Operacional e Marketing enxergam apenas os módulos autorizados."
            />
            <InfoCard
              label="Boas práticas"
              value="Crie um usuário por área para evitar compartilhamento de login e perda de rastreabilidade."
            />
          </div>
        </article>
      </form>

      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={handleCreateUser}
          className="rounded-3xl border border-border bg-surface p-6 shadow-sm"
        >
          <h3 className="text-2xl font-heading text-slate-950">Novo usuário</h3>
          <p className="mt-2 text-sm text-slate-600">
            Crie acessos separados por papel para reduzir ruído e melhorar a operação diária.
          </p>

          <div className="mt-5 space-y-3">
            <input
              value={userForm.name}
              onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nome completo"
              className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="email"
              value={userForm.email}
              onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="E-mail"
              className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="password"
              value={userForm.password}
              onChange={(event) =>
                setUserForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="Senha inicial"
              className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
            />
            <select
              value={userForm.role}
              onChange={(event) =>
                setUserForm((prev) => ({ ...prev, role: event.target.value as UserRole }))
              }
              className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
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
            className="mt-4 w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {usersSaving ? "Salvando..." : "Criar usuário"}
          </button>

          {usersError ? <p className="mt-4 text-sm text-red-600">{usersError}</p> : null}
        </form>

        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-heading text-slate-950">Equipe da organização</h3>
              <p className="mt-2 text-sm text-slate-600">
                Cada papel enxerga somente os módulos necessários na lateral e nas APIs.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {users.length} usuário(s)
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {users.map((user) => {
              const isCurrentUser = user.email === initialEmail;

              return (
                <div
                  key={user.id}
                  className="grid gap-3 rounded-3xl border border-border bg-surface-muted/70 p-4 md:grid-cols-[1fr_190px_auto]"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{user.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Desde {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      {isCurrentUser ? " • usuário atual" : ""}
                    </p>
                  </div>

                  <select
                    value={user.role}
                    disabled={usersSaving || isCurrentUser}
                    onChange={(event) =>
                      void handleRoleChange(user.id, event.target.value as UserRole)
                    }
                    className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
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
                    className="rounded-2xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-600 disabled:opacity-40"
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
