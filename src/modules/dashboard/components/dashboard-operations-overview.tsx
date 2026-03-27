import Link from "next/link";
import { getAuthFromCookies } from "@/lib/auth-server";
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

  const diffMs = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} dia(s) atras`;
  }
  if (diffDays === 0) {
    return "Hoje";
  }
  return `Em ${diffDays} dia(s)`;
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "ok":
      return "bg-emerald-100 text-emerald-700";
    case "warning":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

export async function DashboardOperationsOverview() {
  const auth = await getAuthFromCookies();
  if (!auth) {
    return null;
  }

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
      operationTasks: {
        select: {
          status: true,
          prazo: true,
        },
      },
      budget: {
        select: {
          atualizadoEm: true,
          metaInscritos: true,
          lucroAlvoPercentual: true,
          taxaPlataformaPercentual: true,
          impostoPercentual: true,
          taxaCancelamentoReembolsoPercentual: true,
          items: {
            select: {
              tipoCusto: true,
              quantidade: true,
              valorUnitario: true,
            },
          },
        },
      },
      regulation: {
        select: {
          atualizadoEm: true,
          dataFimInscricao: true,
        },
      },
    },
  });

  const now = new Date();
  const upcomingEvents = events.filter((event) => event.dataEvento >= now).slice(0, 4);
  const pendingBudgetCount = events.filter((event) => !event.budget).length;
  const pendingRegulationCount = events.filter((event) => !event.regulation).length;
  const pendingOperationCount = events.filter((event) =>
    event.operationTasks.some((task) => task.status !== "CONCLUIDA"),
  ).length;
  const alertEvents = events.filter((event) => {
    if (event.status === "FINALIZADO") {
      return false;
    }

    const eventDiffDays = Math.ceil(
      (event.dataEvento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const registrationDiffDays = event.regulation
      ? Math.ceil(
          (event.regulation.dataFimInscricao.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    const overdueOperationTask = event.operationTasks.some(
      (task) =>
        task.status !== "CONCLUIDA" && task.prazo && task.prazo.getTime() < now.getTime(),
    );

    return (
      eventDiffDays <= 14 ||
      !event.budget ||
      !event.regulation ||
      overdueOperationTask ||
      (registrationDiffDays !== null && registrationDiffDays <= 7)
    );
  });

  const statusRows = events.slice(0, 6).map((event) => {
    const hasBudget = Boolean(event.budget);
    const hasRegulation = Boolean(event.regulation);
    const hasMarketing = true;

    const calculations = event.budget
      ? calculateBudgetMetrics({
          metaInscritos: event.budget.metaInscritos,
          lucroAlvoPercentual: event.budget.lucroAlvoPercentual,
          taxaPlataformaPercentual: event.budget.taxaPlataformaPercentual,
          impostoPercentual: event.budget.impostoPercentual,
          taxaCancelamentoReembolsoPercentual:
            event.budget.taxaCancelamentoReembolsoPercentual,
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
      budget: hasBudget
        ? {
            label: "Pronto",
            tone: "ok",
            detail: calculations ? brl(calculations.precoRecomendadoParaLucro) : "-",
          }
        : { label: "Pendente", tone: "warning", detail: "Sem orcamento" },
      regulation: hasRegulation
        ? {
            label: "Pronto",
            tone: "ok",
            detail: formatDate(event.regulation!.atualizadoEm),
          }
        : { label: "Pendente", tone: "warning", detail: "Sem regulamento" },
      marketing: hasMarketing
        ? { label: "Disponivel", tone: "default", detail: "PDF pronto para gerar" }
        : { label: "Pendente", tone: "warning", detail: "-" },
      operation: event.operationTasks.some((task) => task.status !== "CONCLUIDA")
        ? {
            label: "Pendente",
            tone: "warning",
            detail: `${event.operationTasks.filter((task) => task.status !== "CONCLUIDA").length} tarefa(s) abertas`,
          }
        : {
            label: "Pronto",
            tone: "ok",
            detail: "Checklist em dia",
          },
    };
  });

  const summaryCards = [
    {
      label: "Eventos ativos",
      value: String(events.filter((event) => event.status !== "FINALIZADO").length),
      hint: `${pendingBudgetCount} sem orcamento`,
    },
    {
      label: "Pendencias de regulamento",
      value: String(pendingRegulationCount),
      hint: "Eventos sem configuracao final",
    },
    {
      label: "Operacao pendente",
      value: String(pendingOperationCount),
      hint: "Eventos com checklist aberto",
    },
    {
      label: "Alertas operacionais",
      value: String(alertEvents.length),
      hint: "Prazos ou modulos pendentes",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Operacao
            </p>
            <h3 className="mt-2 text-3xl font-heading text-zinc-900">
              Radar operacional da organizacao
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Visao rapida das pendencias mais importantes antes da prova.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/orcamento"
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm font-semibold text-zinc-700"
            >
              Abrir orcamento
            </Link>
            <Link
              href="/regulamento"
              className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white"
            >
              Ajustar regulamento
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-border bg-surface-muted/70 p-4"
            >
              <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{card.label}</p>
              <p className="mt-2 text-3xl font-heading text-zinc-900">{card.value}</p>
              <p className="mt-2 text-sm text-zinc-600">{card.hint}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Proximos eventos
              </p>
              <h4 className="mt-2 text-2xl font-heading text-zinc-900">Agenda critica</h4>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface-muted p-4 text-sm text-zinc-600">
                Nenhum evento futuro cadastrado.
              </p>
            ) : (
              upcomingEvents.map((event) => {
                const hasBudget = Boolean(event.budget);
                const hasRegulation = Boolean(event.regulation);

                return (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-border bg-surface-muted/60 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h5 className="text-xl font-heading text-zinc-900">{event.nomeEvento}</h5>
                        <p className="text-sm text-zinc-600">
                          {event.cidade}/{event.estado} - {formatDate(event.dataEvento)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {event.modalidades || "Modalidades nao informadas"} |{" "}
                          {event.distancias || "Distancias nao informadas"} |{" "}
                          {event.capacidadeMaxima ? `${event.capacidadeMaxima} atletas` : "Capacidade nao informada"}
                        </p>
                      </div>
                      <span className="rounded-lg bg-accent-soft px-3 py-1 text-xs font-semibold text-amber-700">
                        {getDaysUntilLabel(event.dataEvento)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                      <span
                        className={`rounded-lg px-3 py-1 ${getStatusBadgeClasses(
                          hasBudget ? "ok" : "warning",
                        )}`}
                      >
                        {hasBudget ? "Orcamento pronto" : "Orcamento pendente"}
                      </span>
                      <span
                        className={`rounded-lg px-3 py-1 ${getStatusBadgeClasses(
                          hasRegulation ? "ok" : "warning",
                        )}`}
                      >
                        {hasRegulation ? "Regulamento pronto" : "Regulamento pendente"}
                      </span>
                      <span
                        className={`rounded-lg px-3 py-1 ${getStatusBadgeClasses(
                          event.operationTasks.some((task) => task.status !== "CONCLUIDA")
                            ? "warning"
                            : "ok",
                        )}`}
                      >
                        {event.operationTasks.some((task) => task.status !== "CONCLUIDA")
                          ? "Operacao pendente"
                          : "Operacao em dia"}
                      </span>
                      <span
                        className={`rounded-lg px-3 py-1 ${getStatusBadgeClasses("default")}`}
                      >
                        Marketing disponivel
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Alertas
          </p>
          <h4 className="mt-2 text-2xl font-heading text-zinc-900">Pontos de atencao</h4>

          <div className="mt-5 space-y-3">
            {alertEvents.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-surface-muted p-4 text-sm text-zinc-600">
                Sem alertas operacionais no momento.
              </p>
            ) : (
              alertEvents.slice(0, 5).map((event) => {
                const issues = [];
                if (!event.budget) {
                  issues.push("sem orcamento");
                }
                if (!event.regulation) {
                  issues.push("sem regulamento");
                }
                if (event.operationTasks.some((task) => task.status !== "CONCLUIDA")) {
                  issues.push("checklist operacional aberto");
                }
                const daysUntilEvent = getDaysUntilLabel(event.dataEvento);

                return (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-border bg-surface-muted/60 p-4"
                  >
                    <p className="text-sm font-semibold text-zinc-900">{event.nomeEvento}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {event.cidade}/{event.estado} - {daysUntilEvent}
                    </p>
                    <p className="mt-2 text-sm text-amber-700">
                      {issues.length > 0 ? issues.join(" - ") : "prazo proximo da prova"}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Modulos
            </p>
            <h4 className="mt-2 text-2xl font-heading text-zinc-900">Status por evento</h4>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-zinc-500">
                <th className="px-3 py-2">Evento</th>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Prazo</th>
                <th className="px-3 py-2">Orcamento</th>
                <th className="px-3 py-2">Regulamento</th>
                <th className="px-3 py-2">Operacao</th>
                <th className="px-3 py-2">Marketing</th>
              </tr>
            </thead>
            <tbody>
              {statusRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-zinc-500">
                    Nenhum evento cadastrado ainda.
                  </td>
                </tr>
              ) : (
                statusRows.map((row) => (
                  <tr key={row.id} className="border-b border-border/80 align-top">
                    <td className="px-3 py-3">
                      <p className="font-medium text-zinc-900">{row.nomeEvento}</p>
                      <p className="text-xs text-zinc-500">{row.cidadeUf}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-600">{row.dataEvento}</td>
                    <td className="px-3 py-3 text-zinc-600">{row.prazo}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                          row.budget.tone,
                        )}`}
                      >
                        {row.budget.label}
                      </span>
                      <p className="mt-1 text-xs text-zinc-500">{row.budget.detail}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                          row.regulation.tone,
                        )}`}
                      >
                        {row.regulation.label}
                      </span>
                      <p className="mt-1 text-xs text-zinc-500">{row.regulation.detail}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                          row.operation.tone,
                        )}`}
                      >
                        {row.operation.label}
                      </span>
                      <p className="mt-1 text-xs text-zinc-500">{row.operation.detail}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                          row.marketing.tone,
                        )}`}
                      >
                        {row.marketing.label}
                      </span>
                      <p className="mt-1 text-xs text-zinc-500">{row.marketing.detail}</p>
                    </td>
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
