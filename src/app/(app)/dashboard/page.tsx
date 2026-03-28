import { UiIcon } from "@/components/ui-icon";
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
        <div className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#fff_0%,#f6fbff_50%,#edf5ff_100%)] p-7 shadow-[0_22px_60px_rgba(16,24,40,0.09)]">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            <UiIcon name="chart" className="h-4 w-4" />
            Painel principal
          </div>
          <h2 className="mt-3 text-4xl text-slate-950 xl:text-5xl">Gestão diária das suas corridas</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">
            Organize eventos, acompanhe a execução e decida mais rápido com um painel desenhado
            para operação real, não só para cadastro.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <TrendCard label="Operação" value="Em foco" description="Checklist, prazos e responsáveis" tone="blue" />
            <TrendCard label="Financeiro" value="Dados vivos" description="Custos, margem e leitura rápida" tone="green" />
            <TrendCard label="Comercial" value="Pronto para agir" description="Pacotes, proposta e PDF" tone="orange" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <QuickAccessCard
            href="/operacao"
            eyebrow="Prioridade"
            title="Abrir checklist"
            description="Atualize tarefas, responsáveis e prazos."
            icon="spark"
          />
          <QuickAccessCard
            href="/orcamento"
            eyebrow="Financeiro"
            title="Revisar orçamento"
            description="Compare cenários e valide margem."
            icon="chart"
          />
          <QuickAccessCard
            href="/regulamento"
            eyebrow="Documento"
            title="Editar regulamento"
            description="Atualize regras e exporte o PDF final."
            icon="download"
          />
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

function QuickAccessCard({
  href,
  eyebrow,
  title,
  description,
  icon,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: "spark" | "chart" | "download";
}) {
  return (
    <a
      href={href}
      className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        <UiIcon name={icon} className="h-4 w-4" />
        {eyebrow}
      </div>
      <p className="mt-3 text-xl text-slate-950">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </a>
  );
}

function TrendCard({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  tone: "blue" | "green" | "orange";
}) {
  const lineClass =
    tone === "green" ? "bg-emerald-500" : tone === "orange" ? "bg-orange-500" : "bg-[#007AFF]";

  return (
    <div className="rounded-3xl border border-border bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <div className="mt-4 flex gap-1">
        <span className={`h-1.5 w-10 rounded-full ${lineClass}`} />
        <span className="h-1.5 w-6 rounded-full bg-slate-200" />
        <span className="h-1.5 w-14 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}
