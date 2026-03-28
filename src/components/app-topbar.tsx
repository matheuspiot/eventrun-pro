"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AppModule, canAccessModule, UserRole } from "@/lib/auth";
import { BaseModal } from "@/components/base-modal";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "default" | "warning" | "success";
};

type AppTopbarProps = {
  organizationName: string;
  userRole: UserRole;
  notifications: NotificationItem[];
};

const pageMeta: Record<string, { eyebrow: string; title: string; description: string }> = {
  "/dashboard": {
    eyebrow: "Painel central",
    title: "Vis\u00e3o operacional do neg\u00f3cio",
    description: "Acompanhe eventos, pend\u00eancias cr\u00edticas e indicadores da opera\u00e7\u00e3o em um s\u00f3 lugar.",
  },
  "/orcamento": {
    eyebrow: "Financeiro",
    title: "Or\u00e7amentos e biblioteca de custos",
    description: "Monte cen\u00e1rios, compare viabilidade e salve a estrutura financeira de cada prova.",
  },
  "/operacao": {
    eyebrow: "Execu\u00e7\u00e3o",
    title: "Checklist operacional da prova",
    description: "Organize tarefas, respons\u00e1veis e prazos para reduzir falhas na entrega do evento.",
  },
  "/marketing": {
    eyebrow: "Comercial",
    title: "Pacotes e proposta comercial",
    description: "Estruture ofertas, cronograma e materiais de venda para patrocinadores e organizadores.",
  },
  "/regulamento": {
    eyebrow: "Documenta\u00e7\u00e3o",
    title: "Regulamento com preview ao vivo",
    description: "Centralize regras, pol\u00edticas e contatos com consist\u00eancia para publica\u00e7\u00e3o e PDF.",
  },
  "/configuracoes": {
    eyebrow: "Administra\u00e7\u00e3o",
    title: "Configura\u00e7\u00f5es da organiza\u00e7\u00e3o",
    description: "Gerencie conta, equipe, perfis de acesso e prefer\u00eancias gerais do sistema.",
  },
};

const quickActionItems: Array<{ module: AppModule; href: string; title: string; description: string }> = [
  {
    module: "dashboard",
    href: "/dashboard",
    title: "Painel executivo",
    description: "Voltar para a vis\u00e3o geral e acompanhar o que precisa de aten\u00e7\u00e3o.",
  },
  {
    module: "orcamento",
    href: "/orcamento",
    title: "Novo or\u00e7amento",
    description: "Entrar direto no m\u00f3dulo financeiro para projetar custos e receita.",
  },
  {
    module: "operacao",
    href: "/operacao",
    title: "Checklist da prova",
    description: "Atualizar tarefas abertas, respons\u00e1veis e prazos operacionais.",
  },
  {
    module: "marketing",
    href: "/marketing",
    title: "Proposta comercial",
    description: "Ajustar pacotes e exportar a proposta do evento em PDF.",
  },
  {
    module: "regulamento",
    href: "/regulamento",
    title: "Editar regulamento",
    description: "Revisar regras, inscri\u00e7\u00e3o, kit e contatos com preview em tempo real.",
  },
  {
    module: "configuracoes",
    href: "/configuracoes",
    title: "Gerir usu\u00e1rios",
    description: "Atualizar equipe, permiss\u00f5es e dados principais da organiza\u00e7\u00e3o.",
  },
];

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  FINANCEIRO: "Financeiro",
  OPERACIONAL: "Operacional",
  MARKETING: "Marketing",
};

const seenNotificationsStorageKey = "eventrun_seen_notifications";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M15 18H9m9-1V11a6 6 0 1 0-12 0v6l-2 2h16l-2-2Z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
      <path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" />
    </svg>
  );
}

export function AppTopbar({ organizationName, userRole, notifications }: AppTopbarProps) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [seenNotificationIds, setSeenNotificationIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(seenNotificationsStorageKey);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const currentPage = pageMeta[pathname] ?? {
    eyebrow: "Workspace",
    title: "Central EventRun Pro",
    description: "Navegue pelos m\u00f3dulos e mantenha a opera\u00e7\u00e3o sob controle.",
  };

  const availableQuickActions = useMemo(
    () => quickActionItems.filter((item) => canAccessModule(userRole, item.module)),
    [userRole],
  );

  function persistSeen(ids: string[]) {
    setSeenNotificationIds(ids);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(seenNotificationsStorageKey, JSON.stringify(ids));
    }
  }

  function markNotificationsAsSeen(ids: string[]) {
    if (ids.length === 0) return;
    const nextIds = Array.from(new Set([...seenNotificationIds, ...ids]));
    persistSeen(nextIds);
  }

  const unreadNotifications = notifications.filter((item) => !seenNotificationIds.includes(item.id));
  const notificationBadge = unreadNotifications.length > 9 ? "9+" : String(unreadNotifications.length);

  return (
    <>
      <header className="sticky top-0 z-30 mb-8 rounded-[30px] border border-white/60 bg-white/80 px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur xl:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              <span>{currentPage.eyebrow}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{organizationName}</span>
            </div>
            <div>
              <h1 className="text-3xl font-heading leading-none text-slate-950 xl:text-4xl">
                {currentPage.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-600 xl:text-[15px]">
                {currentPage.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:min-w-[280px] xl:items-end">
            <div className="flex w-full flex-wrap items-center gap-3 xl:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowQuickActions(true);
                  setShowNotifications(false);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-900"
              >
                <SparkIcon />
                A\u00e7\u00f5es r\u00e1pidas
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const nextOpen = !showNotifications;
                    setShowNotifications(nextOpen);
                    setShowQuickActions(false);
                    if (nextOpen) {
                      markNotificationsAsSeen(notifications.map((item) => item.id));
                    }
                  }}
                  className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
                >
                  <BellIcon />
                  {unreadNotifications.length > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-6 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold text-white">
                      {notificationBadge}
                    </span>
                  ) : null}
                </button>

                {showNotifications ? (
                  <div className="absolute right-0 top-14 z-40 w-[360px] rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">Central de notifica\u00e7\u00f5es</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Alertas operacionais e atalhos para o que precisa de aten\u00e7\u00e3o.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {notifications.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                          Nenhuma notifica\u00e7\u00e3o pendente no momento.
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => {
                              markNotificationsAsSeen([item.id]);
                              setShowNotifications(false);
                            }}
                            className="block rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-slate-300 hover:bg-white"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                              </div>
                              <span
                                className={`mt-0.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                                  item.tone === "warning"
                                    ? "bg-amber-100 text-amber-700"
                                    : item.tone === "success"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {item.tone === "warning"
                                  ? "Aten\u00e7\u00e3o"
                                  : item.tone === "success"
                                    ? "OK"
                                    : "Info"}
                              </span>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {roleLabels[userRole]}
            </div>
          </div>
        </div>
      </header>

      <BaseModal
        open={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        title="A\u00e7\u00f5es r\u00e1pidas"
        description="Atalhos para as tarefas mais comuns do dia a dia da opera\u00e7\u00e3o."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {availableQuickActions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setShowQuickActions(false)}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
            >
              <p className="text-base font-semibold text-slate-950">{item.title}</p>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </Link>
          ))}
        </div>
      </BaseModal>
    </>
  );
}
