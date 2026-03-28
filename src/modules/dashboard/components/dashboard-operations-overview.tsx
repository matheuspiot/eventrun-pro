import Link from "next/link";
import { UiIcon } from "@/components/ui-icon";
import { getAuthFromCookies } from "@/lib/auth-server";
import { UserRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateBudgetMetrics } from "@/modules/budget/event-budget.calculations";

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: Date) {
  return value.toLocaleDateString("pt-BR");
}

function getDaysUntilLabel(value: Date) {
  const now = new Date();
  const eventDate = new Date(value);
  now.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)} dia(s) atrás`;
  if (diffDays === 0) return "Hoje";
  return `Em ${diffDays} dia(s)`;
}

function badgeClasses(tone: "ok" | "warning" | "default") {
  if (tone === "ok") return "bg-emerald-100 text-emerald-700";
  if (tone === "warning") return "bg-amber-100 text-amber-700";
  return "bg-zinc-100 text-zinc-700";
}

function getRoleActions(role: UserRole) {
  if (role === "FINANCEIRO") {
    return [
      { title: "Revisar orçamento", description: "Atualize margens, taxas e meta de inscritos.", href: "/orcamento", tone: "solid" },
      { title: "Ver resumo financeiro", description: "Compare break-even, lucro e preço mínimo.", href: "#financeiro", tone: "soft" },
    ] as const;
  }
  if (role === "OPERACIONAL") {
    return [
      { title: "Abrir checklist", description: "Atualize prazos, responsáveis e pendências.", href: "/operacao", tone: "solid" },
      { title: "Ajustar regulamento", description: "Revise regras, kit e contatos oficiais.", href: "/regulamento", tone: "soft" },
    ] as const;
  }
  if (role === "MARKETING") {
    return [
      { title: "Gerar proposta", description: "Acesse os pacotes e exporte o material comercial.", href: "/marketing", tone: "solid" },
      { title: "Eventos futuros", description: "Veja as próximas provas para acionar divulgação.", href: "/dashboard", tone: "soft" },
    ] as const;
  }
  return [
    { title: "Abrir operação", description: "Priorize tarefas, prazos e execução da prova.", href: "/operacao", tone: "solid" },
    { title: "Revisar orçamento", description: "Valide preço, margem e cenários de receita.", href: "/orcamento", tone: "soft" },
    { title: "Editar regulamento", description: "Atualize regras e exporte a versão final.", href: "/regulamento", tone: "soft" },
  ] as const;
}

export async function DashboardOperationsOverview() {
  const auth = await getAuthFromCookies();
  if (!auth) return null;

  const events = await prisma.event.findMany({
    where: { organizationId: auth.organizationId },
    orderBy: { dataEvento: "asc" },
    select: {
      id: true,
      nomeEvento: true,
      dataEvento: true,
      cidade: true,
      estado: true,
      modalidades: true,
      distancias: true,
      capacidadeMaxima: true,
      status: true,
      operationTasks: { select: { status: true, prazo: true } },
      budget: {
        select: {
          metaInscritos: true,
          lucroAlvoPercentual: true,
          taxaPlataformaPercentual: true,
          impostoPercentual: true,
          taxaCancelamentoReembolsoPercentual: true,
          items: { select: { tipoCusto: true, quantidade: true, valorUnitario: true } },
        },
      },
      regulation: { select: { atualizadoEm: true, dataFimInscricao: true } },
    },
  });

  const now = new Date();
  const upcomingEvents = events.filter((event) => event.dataEvento >= now).slice(0, 4);
  const alertEvents = events
    .filter((event) => {
      const dueSoon = Math.ceil((event.dataEvento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 14;
      const registrationDue = event.regulation
        ? Math.ceil((event.regulation.dataFimInscricao.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 7
        : false;
      const operationPending = event.operationTasks.some(
        (task) => task.status !== "CONCLUIDA" && (!task.prazo || task.prazo.getTime() <= now.getTime()),
      );
      return event.status !== "FINALIZADO" && (dueSoon || registrationDue || !event.budget || !event.regulation || operationPending);
    })
    .slice(0, 5);

  const statusRows = events.slice(0, 6).map((event) => {
    const calculations = event.budget
      ? calculateBudgetMetrics({
          metaInscritos: event.budget.metaInscritos,
          lucroAlvoPercentual: event.budget.lucroAlvoPercentual,
          taxaPlataformaPercentual: event.budget.taxaPlataformaPercentual,
          impostoPercentual: event.budget.impostoPercentual,
          taxaCancelamentoReembolsoPercentual: event.budget.taxaCancelamentoReembolsoPercentual,
          items: event.budget.items.map((item) => ({
            tipoCusto: item.tipoCusto,
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
          })),
        })
      : null;

    return {
      id: event.id,
      nomeEvento: event.nomeEvento,
      cidadeUf: `${event.cidade}/${event.estado}`,
      dataEvento: formatDate(event.dataEvento),
      prazo: getDaysUntilLabel(event.dataEvento),
      budget: event.budget
        ? { label: "Pronto", tone: "ok" as const, detail: calculations ? brl(calculations.precoRecomendadoParaLucro) : "-" }
        : { label: "Pendente", tone: "warning" as const, detail: "Sem orçamento" },
      regulation: event.regulation
        ? { label: "Pronto", tone: "ok" as const, detail: formatDate(event.regulation.atualizadoEm) }
        : { label: "Pendente", tone: "warning" as const, detail: "Sem regulamento" },
      operation: event.operationTasks.some((task) => task.status !== "CONCLUIDA")
        ? { label: "Pendente", tone: "warning" as const, detail: `${event.operationTasks.filter((task) => task.status !== "CONCLUIDA").length} tarefa(s) abertas` }
        : { label: "Em dia", tone: "ok" as const, detail: "Checklist atualizado" },
      marketing: { label: "Disponível", tone: "default" as const, detail: "PDF pronto para gerar" },
    };
  });

  const summaryCards = [
    {
      label: "Eventos ativos",
      value: String(events.filter((event) => event.status !== "FINALIZADO").length),
      hint: `${events.filter((event) => !event.budget).length} sem orçamento`,
    },
    {
      label: "Regulamentos pendentes",
      value: String(events.filter((event) => !event.regulation).length),
      hint: "Eventos sem versão final configurada",
    },
    {
      label: "Checklist aberto",
      value: String(events.filter((event) => event.operationTasks.some((task) => task.status !== "CONCLUIDA")).length),
      hint: "Tarefas operacionais ainda em aberto",
    },
    {
      label: "Alertas de prazo",
      value: String(alertEvents.length),
      hint: "Pontos que pedem ação agora",
    },
  ];

  const roleActions = getRoleActions(auth.role);

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              <UiIcon name="spark" className="h-4 w-4" />
              Radar operacional
            </div>
            <h3 className="mt-2 text-3xl text-zinc-900">Prioridades da organização</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              Os cards abaixo mudam o foco de ação conforme o perfil logado e o estado dos eventos.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roleActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className={`rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 ${
                  action.tone === "solid"
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-surface-muted/70 text-zinc-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <UiIcon name={action.tone === "solid" ? "spark" : "chart"} className={`h-4 w-4 ${action.tone === "solid" ? "text-white" : "text-accent"}`} />
                  <p className={`text-sm ${action.tone === "solid" ? "text-white" : "text-zinc-900"}`}>{action.title}</p>
                </div>
                <p className={`mt-2 text-sm ${action.tone === "solid" ? "text-white/85" : "text-zinc-600"}`}>{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article key={card.label} className="rounded-2xl border border-border bg-surface-muted/70 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{card.label}</p>
              <p className="mt-2 text-3xl text-zinc-900">{card.value}</p>
              <p className="mt-2 text-sm text-zinc-600">{card.hint}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            <UiIcon name="calendar" className="h-4 w-4" />
            Próximos eventos
          </div>
          <h4 className="mt-2 text-2xl text-zinc-900">Agenda crítica</h4>
          <div className="mt-5 space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface-muted p-4 text-sm text-zinc-600">Nenhum evento futuro cadastrado.</p>
            ) : (
              upcomingEvents.map((event) => (
                <article key={event.id} className="rounded-3xl border border-border bg-surface-muted/60 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h5 className="text-xl text-zinc-900">{event.nomeEvento}</h5>
                      <p className="text-sm text-zinc-600">{event.cidade}/{event.estado} · {formatDate(event.dataEvento)}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {event.modalidades || "Modalidades não informadas"} · {event.distancias || "Distâncias não informadas"} · {event.capacidadeMaxima ? `${event.capacidadeMaxima} atletas` : "Capacidade não informada"}
                      </p>
                    </div>
                    <span className="rounded-lg bg-accent-soft px-3 py-1 text-xs font-semibold text-blue-700">{getDaysUntilLabel(event.dataEvento)}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            <UiIcon name="spark" className="h-4 w-4" />
            Alertas
          </div>
          <h4 className="mt-2 text-2xl text-zinc-900">Pontos de atenção</h4>
          <div className="mt-5 space-y-3">
            {alertEvents.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface-muted p-4 text-sm text-zinc-600">Sem alertas operacionais no momento.</p>
            ) : (
              alertEvents.map((event) => {
                const issues = [];
                if (!event.budget) issues.push("orçamento pendente");
                if (!event.regulation) issues.push("regulamento pendente");
                if (event.operationTasks.some((task) => task.status !== "CONCLUIDA")) issues.push("checklist aberto");
                return (
                  <article key={event.id} className="rounded-2xl border border-border bg-surface-muted/60 p-4">
                    <p className="text-sm font-semibold text-zinc-900">{event.nomeEvento}</p>
                    <p className="mt-1 text-sm text-zinc-600">{event.cidade}/{event.estado} · {getDaysUntilLabel(event.dataEvento)}</p>
                    <p className="mt-2 text-sm text-amber-700">{issues.length > 0 ? issues.join(" · ") : "Prazo próximo da prova"}</p>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          <UiIcon name="chart" className="h-4 w-4" />
          Módulos
        </div>
        <h4 className="mt-2 text-2xl text-zinc-900">Status por evento</h4>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-zinc-500">
                <th className="px-3 py-2">Evento</th>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Prazo</th>
                <th className="px-3 py-2">Orçamento</th>
                <th className="px-3 py-2">Regulamento</th>
                <th className="px-3 py-2">Operação</th>
                <th className="px-3 py-2">Marketing</th>
              </tr>
            </thead>
            <tbody>
              {statusRows.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-zinc-500">Nenhum evento cadastrado ainda.</td></tr>
              ) : (
                statusRows.map((row) => (
                  <tr key={row.id} className="border-b border-border/80 align-top">
                    <td className="px-3 py-3"><p className="font-medium text-zinc-900">{row.nomeEvento}</p><p className="text-xs text-zinc-500">{row.cidadeUf}</p></td>
                    <td className="px-3 py-3 text-zinc-600">{row.dataEvento}</td>
                    <td className="px-3 py-3 text-zinc-600">{row.prazo}</td>
                    <td className="px-3 py-3"><span className={`rounded-lg px-2 py-1 text-xs font-semibold ${badgeClasses(row.budget.tone)}`}>{row.budget.label}</span><p className="mt-1 text-xs text-zinc-500">{row.budget.detail}</p></td>
                    <td className="px-3 py-3"><span className={`rounded-lg px-2 py-1 text-xs font-semibold ${badgeClasses(row.regulation.tone)}`}>{row.regulation.label}</span><p className="mt-1 text-xs text-zinc-500">{row.regulation.detail}</p></td>
                    <td className="px-3 py-3"><span className={`rounded-lg px-2 py-1 text-xs font-semibold ${badgeClasses(row.operation.tone)}`}>{row.operation.label}</span><p className="mt-1 text-xs text-zinc-500">{row.operation.detail}</p></td>
                    <td className="px-3 py-3"><span className={`rounded-lg px-2 py-1 text-xs font-semibold ${badgeClasses(row.marketing.tone)}`}>{row.marketing.label}</span><p className="mt-1 text-xs text-zinc-500">{row.marketing.detail}</p></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
