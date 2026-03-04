"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AppSidebarProps = {
  organizationName: string;
  userName: string;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Orçamento", href: "/orcamento" },
  { label: "Marketing", href: "/marketing" },
  { label: "Regulamento", href: "/regulamento" },
  { label: "Configurações", href: "/configuracoes" },
];

export function AppSidebar({ organizationName, userName }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-72 bg-gradient-to-b from-sidebar-start to-sidebar-end p-6 text-white shadow-2xl">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">EventRun Pro</p>
        <h1 className="mt-2 text-2xl font-heading">CORRIDAS</h1>
        <p className="mt-3 text-sm text-white/80">{organizationName}</p>
        <p className="text-xs text-white/60">{userName}</p>
      </div>

      <nav className="mt-8 space-y-2">
        {navItems.map((item) => {
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

