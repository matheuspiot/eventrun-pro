import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { calculateBudgetMetrics } from "@/modules/budget/event-budget.calculations";
import {
  getEventBudgetForOrganization,
  saveEventBudgetForOrganization,
} from "@/modules/budget/event-budget.service";
import { eventBudgetInputSchema } from "@/modules/budget/event-budget.validation";

function serializeBudget(
  budget: Awaited<ReturnType<typeof getEventBudgetForOrganization>>,
) {
  if (!budget) {
    return null;
  }

  const items = budget.items.map((item) => ({
    id: item.id,
    costItemId: item.costItemId,
    nome: item.costItem.nome,
    unidade: item.costItem.unidade,
    tipoCusto: item.tipoCusto,
    quantidade: item.quantidade.toString(),
    valorUnitario: item.valorUnitario.toString(),
  }));

  const calculations = calculateBudgetMetrics({
    metaInscritos: budget.metaInscritos,
    lucroAlvoPercentual: Number(budget.lucroAlvoPercentual),
    taxaPlataformaPercentual: Number(budget.taxaPlataformaPercentual),
    impostoPercentual: Number(budget.impostoPercentual),
    taxaCancelamentoReembolsoPercentual: Number(
      budget.taxaCancelamentoReembolsoPercentual,
    ),
    items: items.map((item) => ({
      tipoCusto: item.tipoCusto,
      quantidade: Number(item.quantidade),
      valorUnitario: Number(item.valorUnitario),
    })),
  });

  return {
    id: budget.id,
    eventId: budget.eventId,
    metaInscritos: budget.metaInscritos,
    patrocinioPrevisto: budget.patrocinioPrevisto.toString(),
    lucroAlvoPercentual: budget.lucroAlvoPercentual.toString(),
    taxaPlataformaPercentual: budget.taxaPlataformaPercentual.toString(),
    impostoPercentual: budget.impostoPercentual.toString(),
    taxaCancelamentoReembolsoPercentual:
      budget.taxaCancelamentoReembolsoPercentual.toString(),
    criadoEm: budget.criadoEm.toISOString(),
    atualizadoEm: budget.atualizadoEm.toISOString(),
    items,
    calculations,
  };
}

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId e obrigatorio" }, { status: 400 });
  }

  const budget = await getEventBudgetForOrganization(auth.organizationId, eventId);
  const serialized = serializeBudget(budget);

  return NextResponse.json({ budget: serialized });
}

export async function PUT(request: NextRequest) {
  const auth = getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = eventBudgetInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await saveEventBudgetForOrganization(auth.organizationId, parsed.data);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  const serialized = serializeBudget(result.budget);

  return NextResponse.json({ budget: serialized });
}
