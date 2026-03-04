import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateBudgetMetrics } from "@/modules/budget/event-budget.calculations";
import { createBudgetPdfBuffer } from "@/modules/budget/pdf";

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId é obrigatório" }, { status: 400 });
  }

  const [event, budget] = await Promise.all([
    prisma.event.findFirst({
      where: { id: eventId, organizationId: auth.organizationId },
    }),
    prisma.eventBudget.findUnique({
      where: { eventId },
      include: {
        items: {
          include: {
            costItem: {
              select: {
                nome: true,
                unidade: true,
              },
            },
          },
        },
      },
    }),
  ]);

  if (!event || !budget) {
    return NextResponse.json(
      { error: "Evento ou orçamento não encontrado" },
      { status: 404 },
    );
  }

  const calculations = calculateBudgetMetrics({
    metaInscritos: budget.metaInscritos,
    lucroAlvoPercentual: Number(budget.lucroAlvoPercentual),
    taxaPlataformaPercentual: Number(budget.taxaPlataformaPercentual),
    impostoPercentual: Number(budget.impostoPercentual),
    taxaCancelamentoReembolsoPercentual: Number(
      budget.taxaCancelamentoReembolsoPercentual,
    ),
    items: budget.items.map((item) => ({
      tipoCusto: item.tipoCusto,
      quantidade: Number(item.quantidade),
      valorUnitario: Number(item.valorUnitario),
    })),
  });

  const lines = [
    "1. Dados Gerais",
    `Evento: ${event.nomeEvento}`,
    `Data: ${event.dataEvento.toLocaleDateString("pt-BR")}`,
    `Cidade/UF: ${event.cidade}/${event.estado}`,
    `Meta de inscritos: ${budget.metaInscritos}`,
    "",
    "2. Premissas Financeiras",
    `Patrocínio previsto: ${brl(Number(budget.patrocinioPrevisto))}`,
    `Lucro-alvo: ${Number(budget.lucroAlvoPercentual).toFixed(2)}%`,
    `Taxa da plataforma: ${Number(budget.taxaPlataformaPercentual).toFixed(2)}%`,
    `Imposto: ${Number(budget.impostoPercentual).toFixed(2)}%`,
    `Cancelamento/reembolso: ${Number(budget.taxaCancelamentoReembolsoPercentual).toFixed(2)}%`,
    "",
    "3. Indicadores",
    `Total de custos fixos: ${brl(calculations.totalCustosFixos)}`,
    `Custo variável por atleta: ${brl(calculations.custoVariavelPorAtleta)}`,
    `Custo total estimado: ${brl(calculations.custoTotalEstimado)}`,
    `Break-even por inscrito: ${brl(calculations.breakEvenInscritos)}`,
    `Preço mínimo de inscrição: ${brl(calculations.precoMinimoInscricao)}`,
    `Preço recomendado para lucro: ${brl(calculations.precoRecomendadoParaLucro)}`,
    `Lucro líquido por inscrição: ${brl(calculations.lucroLiquidoEstimado)}`,
    "",
    "4. Itens do Orçamento",
    ...budget.items.map((item, index) => {
      const subtotal = Number(item.quantidade) * Number(item.valorUnitario);
      return `${index + 1}) ${item.costItem.nome} | Tipo: ${item.tipoCusto} | Qtd: ${Number(
        item.quantidade,
      ).toFixed(2)} ${item.costItem.unidade.toLowerCase()} | Unitário: ${brl(
        Number(item.valorUnitario),
      )} | Subtotal: ${brl(subtotal)}`;
    }),
  ];

  const pdfBytes = await createBudgetPdfBuffer(
    "Orçamento do Evento",
    `${event.nomeEvento} | ${event.cidade}/${event.estado}`,
    lines.join("\n"),
  );
  const normalizedBytes = new Uint8Array(pdfBytes.length);
  normalizedBytes.set(pdfBytes);
  const pdfBlob = new Blob([normalizedBytes], { type: "application/pdf" });

  return new NextResponse(pdfBlob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="orcamento-${eventId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
