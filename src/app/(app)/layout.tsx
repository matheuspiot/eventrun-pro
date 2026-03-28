import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { UiFeedbackProvider } from "@/components/ui-feedback-provider";
import { getAuthFromCookies } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const auth = await getAuthFromCookies();

  if (!auth) {
    redirect("/login");
  }

  const now = new Date();
  const reminderWindowEnd = new Date(now.getTime() + 1000 * 60 * 60 * 24);

  const [
    organization,
    nextEvent,
    pendingBudgetCount,
    pendingRegulationCount,
    pendingTaskCount,
    reminderTasks,
  ] = await Promise.all([
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
    prisma.eventOperationTask.findMany({
      where: {
        event: {
          organizationId: auth.organizationId,
          status: { not: "FINALIZADO" },
        },
        status: { not: "CONCLUIDA" },
        lembreteEm: {
          gte: now,
          lte: reminderWindowEnd,
        },
      },
      orderBy: { lembreteEm: "asc" },
      take: 4,
      select: {
        id: true,
        titulo: true,
        lembreteEm: true,
        event: {
          select: {
            nomeEvento: true,
          },
        },
      },
    }),
  ]);

  const notifications: Parameters<typeof AppTopbar>[0]["notifications"] = [
    nextEvent
      ? {
          id: `next-event-${nextEvent.id}`,
          readKey: `next-event:${nextEvent.id}:${nextEvent.dataEvento.toISOString()}`,
          title: `Próximo evento: ${nextEvent.nomeEvento}`,
          description: `${nextEvent.cidade}/${nextEvent.estado} em ${new Date(nextEvent.dataEvento).toLocaleDateString("pt-BR")}.`,
          href: "/dashboard",
          tone: "default" as const,
        }
      : null,
    pendingBudgetCount > 0
      ? {
          id: "pending-budgets",
          readKey: `pending-budgets:${pendingBudgetCount}`,
          title: `${pendingBudgetCount} orçamento(s) pendente(s)`,
          description: "Há eventos ativos sem projeção financeira concluída.",
          href: "/orcamento",
          tone: "warning" as const,
        }
      : null,
    pendingRegulationCount > 0
      ? {
          id: "pending-regulations",
          readKey: `pending-regulations:${pendingRegulationCount}`,
          title: `${pendingRegulationCount} regulamento(s) pendente(s)`,
          description: "Alguns eventos ainda não têm documentação final publicada.",
          href: "/regulamento",
          tone: "warning" as const,
        }
      : null,
    pendingTaskCount > 0
      ? {
          id: "pending-tasks",
          readKey: `pending-tasks:${pendingTaskCount}`,
          title: `${pendingTaskCount} tarefa(s) operacional(is) aberta(s)`,
          description: "Vale revisar responsáveis e prazos para evitar gargalos.",
          href: "/operacao",
          tone: "warning" as const,
        }
      : {
          id: "operations-ok",
          readKey: "operations-ok",
          title: "Checklist operacional controlado",
          description: "Nenhuma tarefa aberta nos eventos ativos neste momento.",
          href: "/operacao",
          tone: "success" as const,
        },
    ...reminderTasks.map((task) => ({
      id: `task-reminder-${task.id}`,
      readKey: `task-reminder:${task.id}:${task.lembreteEm?.toISOString() ?? "none"}`,
      title: `Lembrete: ${task.titulo}`,
      description: `${task.event.nomeEvento} em ${task.lembreteEm?.toLocaleString("pt-BR") ?? "-"}.`,
      href: "/operacao",
      tone: "warning" as const,
    })),
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
