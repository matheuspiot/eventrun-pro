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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={shared}>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="11" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="17" width="7" height="3" rx="1.5" />
        </svg>
      );
    case "operacao":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={shared}>
          <path d="M9 3h6" />
          <path d="M9 21h6" />
          <path d="M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "orcamento":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={shared}>
          <path d="M4 7h16" />
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M15 13h3" />
          <path d="M7 13h4" />
        </svg>
      );
    case "marketing":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={shared}>
          <path d="M4 12h4l9-4v8l-9-4H4Z" />
          <path d="M8 12v5a2 2 0 0 0 2 2h1" />
          <path d="M18 10a3 3 0 0 1 0 4" />
        </svg>
      );
    case "regulamento":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={shared}>
          <path d="M7 4h8l4 4v12H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
          <path d="M15 4v4h4" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </svg>
      );
    case "configuracoes":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={shared}>
          <path d="M4 7h9" />
          <path d="M17 7h3" />
          <path d="M4 17h3" />
          <path d="M11 17h9" />
          <circle cx="15" cy="7" r="2" />
          <circle cx="9" cy="17" r="2" />
        </svg>
      );
  }
}

export function AppSidebar({ organizationName, userName, userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const allowedItems = navItems.filter((item) => canAccessModule(userRole, item.module));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[296px] flex-col border-r border-white/10 bg-[radial-gradient(circle_at_top,_rgba(0,122,255,0.18),_transparent_34%),linear-gradient(180deg,#101828_0%,#162034_54%,#20304d_100%)] px-6 py-6 text-white shadow-[28px_0_80px_rgba(16,24,40,0.24)] xl:flex">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">EventRun Pro</p>
            <h1 className="mt-3 text-[2rem] leading-none text-white">Corridas</h1>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
            Online
          </span>
        </div>

        <div className="mt-5 rounded-2xl bg-black/15 p-4">
          <p className="text-sm font-semibold text-white">{organizationName}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">{userName}</p>
          <span className="mt-3 inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold text-white/75">
            {roleLabels[userRole]}
          </span>
        </div>
      </div>

      <div className="mt-7">
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
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-white text-slate-950 shadow-[0_18px_34px_rgba(0,122,255,0.16)]"
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
                <p className="truncate">{item.label}</p>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto pt-4">
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
