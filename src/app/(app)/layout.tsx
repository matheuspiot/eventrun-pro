import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { UiFeedbackProvider } from "@/components/ui-feedback-provider";
import { getAuthFromCookies } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthFromCookies();

  if (!auth) {
    redirect("/login");
  }

  const now = new Date();

  const [organization, nextEvent, pendingBudgetCount, pendingRegulationCount, pendingTaskCount] =
    await Promise.all([
      prisma.organization.findUnique({
        where: { id: auth.organizationId },
        select: { name: true },
      }),
      prisma.event.findFirst({
        where: {
          organizationId: auth.organizationId,
          dataEvento: { gte: now },
          status: { not: "FINALIZADO" },
        },
        orderBy: { dataEvento: "asc" },
        select: {
          id: true,
          nomeEvento: true,
          dataEvento: true,
          cidade: true,
          estado: true,
        },
      }),
      prisma.event.count({
        where: {
          organizationId: auth.organizationId,
          status: { not: "FINALIZADO" },
          budget: null,
        },
      }),
      prisma.event.count({
        where: {
          organizationId: auth.organizationId,
          status: { not: "FINALIZADO" },
          regulation: null,
        },
      }),
      prisma.eventOperationTask.count({
        where: {
          event: {
            organizationId: auth.organizationId,
            status: { not: "FINALIZADO" },
          },
          status: { not: "CONCLUIDA" },
        },
      }),
    ]);

  const notifications: Parameters<typeof AppTopbar>[0]["notifications"] = [
    nextEvent
      ? {
          id: "next-event",
          title: `Próximo evento: ${nextEvent.nomeEvento}`,
          description: `${nextEvent.cidade}/${nextEvent.estado} em ${new Date(nextEvent.dataEvento).toLocaleDateString("pt-BR")}.`,
          href: "/dashboard",
          tone: "default" as const,
        }
      : null,
    pendingBudgetCount > 0
      ? {
          id: "pending-budgets",
          title: `${pendingBudgetCount} orçamento(s) pendente(s)`,
          description: "Há eventos ativos sem projeção financeira concluída.",
          href: "/orcamento",
          tone: "warning" as const,
        }
      : null,
    pendingRegulationCount > 0
      ? {
          id: "pending-regulations",
          title: `${pendingRegulationCount} regulamento(s) pendente(s)`,
          description: "Alguns eventos ainda não têm documentação final publicada.",
          href: "/regulamento",
          tone: "warning" as const,
        }
      : null,
    pendingTaskCount > 0
      ? {
          id: "pending-tasks",
          title: `${pendingTaskCount} tarefa(s) operacional(is) aberta(s)`,
          description: "Vale revisar responsáveis e prazos para evitar gargalos.",
          href: "/operacao",
          tone: "warning" as const,
        }
      : {
          id: "operations-ok",
          title: "Checklist operacional controlado",
          description: "Nenhuma tarefa aberta nos eventos ativos neste momento.",
          href: "/operacao",
          tone: "success" as const,
        },
  ].filter((item): item is Parameters<typeof AppTopbar>[0]["notifications"][number] => Boolean(item));

  return (
    <UiFeedbackProvider>
      <div className="min-h-screen bg-background">
        <AppSidebar
          organizationName={organization?.name ?? "Organização"}
          userName={auth.name}
          userRole={auth.role}
        />

        <main className="min-h-screen px-4 py-4 sm:px-6 xl:ml-[296px] xl:px-8 xl:py-7">
          <div className="mx-auto max-w-[1680px]">
            <AppTopbar
              organizationName={organization?.name ?? "Organização"}
              userName={auth.name}
              userRole={auth.role}
              notifications={notifications}
            />
            {children}
          </div>
        </main>
      </div>
    </UiFeedbackProvider>
  );
}
