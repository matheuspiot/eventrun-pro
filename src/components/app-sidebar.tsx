"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppModule, canAccessModule, UserRole } from "@/lib/auth";

type AppSidebarProps = {
  organizationName: string;
  userName: string;
  userRole: UserRole;
};

const navItems: Array<{ label: string; href: string; module: AppModule }> = [
  { label: "Dashboard", href: "/dashboard", module: "dashboard" },
  { label: "Operação", href: "/operacao", module: "operacao" },
  { label: "Orçamento", href: "/orcamento", module: "orcamento" },
  { label: "Marketing", href: "/marketing", module: "marketing" },
  { label: "Regulamento", href: "/regulamento", module: "regulamento" },
  { label: "Configurações", href: "/configuracoes", module: "configuracoes" },
];

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  FINANCEIRO: "Financeiro",
  OPERACIONAL: "Operacional",
  MARKETING: "Marketing",
};

function ModuleIcon({ module }: { module: AppModule }) {
  const shared = "h-[18px] w-[18px]";

  switch (module) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={shared}>
          <path d="M4 13h7V4H4v9Zm9 7h7V11h-7v9ZM4 20h7v-5H4v5Zm9-11h7V4h-7v5Z" />
        </svg>
      );
    case "operacao":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={shared}>
          <path d="m5 12 4 4L19 6" />
          <path d="M7 5h11" />
          <path d="M7 19h11" />
        </svg>
      );
    case "orcamento":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={shared}>
          <path d="M3 7h18" />
          <path d="M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
          <path d="M16 14h.01" />
          <path d="M7 14h5" />
        </svg>
      );
    case "marketing":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={shared}>
          <path d="M4 18V8l8-4 8 4v10" />
          <path d="M12 12v8" />
          <path d="M8 14h8" />
        </svg>
      );
    case "regulamento":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={shared}>
          <path d="M7 4h8l4 4v12H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
          <path d="M15 4v4h4" />
          <path d="M9 13h6" />
          <path d="M9 17h6" />
        </svg>
      );
    case "configuracoes":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={shared}>
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.8a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.8a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.7 1.6Z" />
        </svg>
      );
  }
}

export function AppSidebar({ organizationName, userName, userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const allowedItems = navItems.filter((item) => canAccessModule(userRole, item.module));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[296px] flex-col border-r border-white/10 bg-[radial-gradient(circle_at_top,_rgba(248,113,52,0.16),_transparent_32%),linear-gradient(180deg,#0f172a_0%,#111827_45%,#162235_100%)] px-6 py-7 text-white shadow-[28px_0_80px_rgba(15,23,42,0.28)] xl:flex">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
              EventRun Pro
            </p>
            <h1 className="mt-3 text-[2rem] font-heading leading-none text-white">Corridas</h1>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
            Online
          </span>
        </div>

        <div className="mt-6 rounded-2xl bg-black/15 p-4">
          <p className="text-sm font-semibold text-white">{organizationName}</p>
          <p className="mt-1 text-sm text-white/65">{userName}</p>
          <span className="mt-3 inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold text-white/75">
            {roleLabels[userRole]}
          </span>
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35">
          Navegação
        </p>
        <nav className="space-y-2">
          {allowedItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${
                  active
                    ? "bg-white text-slate-950 shadow-[0_18px_34px_rgba(248,113,52,0.18)]"
                    : "text-white/72 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                    active
                      ? "bg-slate-950 text-white"
                      : "bg-white/8 text-white/65 group-hover:bg-white/12 group-hover:text-white"
                  }`}
                >
                  <ModuleIcon module={item.module} />
                </span>
                <div className="min-w-0">
                  <p className="truncate">{item.label}</p>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-4">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">Operação mais clara</p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Use o sino para ver alertas e as ações rápidas para entrar direto no fluxo certo.
          </p>
        </div>

        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Encerrar sessão
          </button>
        </form>
      </div>
    </aside>
  );
}
