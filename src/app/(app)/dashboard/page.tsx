import { requireModuleAccess } from "@/lib/access";
import { DashboardFinancialSummary } from "@/modules/dashboard/components/dashboard-financial-summary";
import { DashboardOperationsOverview } from "@/modules/dashboard/components/dashboard-operations-overview";
import { EventsManager } from "@/modules/events/components/events-manager";

type DashboardPageProps = {
  searchParams?: Promise<{ forbidden?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  await requireModuleAccess("dashboard");
  const params = (await searchParams) ?? {};

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#fff_0%,#fff7f1_50%,#eef6ff_100%)] p-7 shadow-[0_22px_60px_rgba(15,23,42,0.10)]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Painel principal
          </p>
          <h2 className="mt-3 text-4xl font-heading text-slate-950 xl:text-5xl">
            Gestão diária das suas corridas
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">
            Organize eventos, acompanhe a execução e decida mais rápido com um painel desenhado
            para operação real, não só para cadastro.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <a
            href="/operacao"
            className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Prioridade
            </p>
            <p className="mt-3 text-xl font-heading text-slate-950">Abrir checklist</p>
            <p className="mt-2 text-sm text-slate-600">Atualize tarefas, responsáveis e prazos.</p>
          </a>
          <a
            href="/orcamento"
            className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Financeiro
            </p>
            <p className="mt-3 text-xl font-heading text-slate-950">Revisar orçamento</p>
            <p className="mt-2 text-sm text-slate-600">Compare cenários e valide margem.</p>
          </a>
          <a
            href="/regulamento"
            className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Documento
            </p>
            <p className="mt-3 text-xl font-heading text-slate-950">Editar regulamento</p>
            <p className="mt-2 text-sm text-slate-600">Atualize regras e exporte o PDF final.</p>
          </a>
        </div>
      </div>

      {params.forbidden ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Seu perfil não tem acesso ao módulo {params.forbidden}.
        </div>
      ) : null}

      <DashboardOperationsOverview />
      <DashboardFinancialSummary />
      <EventsManager />
    </section>
  );
}
