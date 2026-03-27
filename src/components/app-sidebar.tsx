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
  { label: "Operacao", href: "/operacao", module: "operacao" },
  { label: "Orcamento", href: "/orcamento", module: "orcamento" },
  { label: "Marketing", href: "/marketing", module: "marketing" },
  { label: "Regulamento", href: "/regulamento", module: "regulamento" },
  { label: "Configuracoes", href: "/configuracoes", module: "configuracoes" },
];

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  FINANCEIRO: "Financeiro",
  OPERACIONAL: "Operacional",
  MARKETING: "Marketing",
};

export function AppSidebar({ organizationName, userName, userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const allowedItems = navItems.filter((item) => canAccessModule(userRole, item.module));

  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-72 bg-gradient-to-b from-sidebar-start to-sidebar-end p-6 text-white shadow-2xl">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">EventRun Pro</p>
        <h1 className="mt-2 text-2xl font-heading">CORRIDAS</h1>
        <p className="mt-3 text-sm text-white/80">{organizationName}</p>
        <p className="text-xs text-white/60">{userName}</p>
        <span className="mt-3 inline-flex rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
          {roleLabels[userRole]}
        </span>
      </div>

      <nav className="mt-8 space-y-2">
        {allowedItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-accent text-white shadow-lg shadow-accent/30"
                  : "bg-white/0 text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form className="mt-8" action="/api/auth/logout" method="post">
        <button
          type="submit"
          className="w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          Logout
        </button>
      </form>
    </aside>
  );
}
