import { DashboardFinancialSummary } from "@/modules/dashboard/components/dashboard-financial-summary";
import { DashboardOperationsOverview } from "@/modules/dashboard/components/dashboard-operations-overview";
import { EventsManager } from "@/modules/events/components/events-manager";
import { requireModuleAccess } from "@/lib/access";

type DashboardPageProps = {
  searchParams?: Promise<{ forbidden?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  await requireModuleAccess("dashboard");
  const params = (await searchParams) ?? {};

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Painel principal
        </p>
        <h2 className="mt-2 text-4xl font-heading text-zinc-900">Projetos de corrida</h2>
      </div>
      {params.forbidden && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Seu perfil não tem acesso ao módulo {params.forbidden}.
        </div>
      )}
      <DashboardOperationsOverview />
      <DashboardFinancialSummary />
      <EventsManager />
    </section>
  );
}
