import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateBudgetMetrics } from "@/modules/budget/event-budget.calculations";
import { createBudgetPdfBuffer } from "@/modules/budget/pdf";

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function numberPt(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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
    return NextResponse.json({ error: "Evento ou orçamento não encontrado" }, { status: 404 });
  }

  const calculations = calculateBudgetMetrics({
    metaInscritos: budget.metaInscritos,
    lucroAlvoPercentual: Number(budget.lucroAlvoPercentual),
    taxaPlataformaPercentual: Number(budget.taxaPlataformaPercentual),
    impostoPercentual: Number(budget.impostoPercentual),
    taxaCancelamentoReembolsoPercentual: Number(budget.taxaCancelamentoReembolsoPercentual),
    items: budget.items.map((item) => ({
      tipoCusto: item.tipoCusto,
      quantidade: Number(item.quantidade),
      valorUnitario: Number(item.valorUnitario),
    })),
  });

  const summarySections = [
    {
      title: "1. Dados gerais",
      rows: [
        { label: "Evento:", value: event.nomeEvento, emphasis: true },
        { label: "Data:", value: event.dataEvento.toLocaleDateString("pt-BR") },
        { label: "Cidade/UF:", value: `${event.cidade}/${event.estado}` },
        { label: "Meta de inscritos:", value: numberPt(budget.metaInscritos), emphasis: true },
      ],
    },
    {
      title: "2. Premissas financeiras",
      rows: [
        { label: "Patrocínio previsto:", value: brl(Number(budget.patrocinioPrevisto)), emphasis: true },
        { label: "Lucro-alvo:", value: `${Number(budget.lucroAlvoPercentual).toFixed(2)}%` },
        { label: "Taxa da plataforma:", value: `${Number(budget.taxaPlataformaPercentual).toFixed(2)}%` },
        { label: "Imposto:", value: `${Number(budget.impostoPercentual).toFixed(2)}%` },
        {
          label: "Cancelamento/reembolso:",
          value: `${Number(budget.taxaCancelamentoReembolsoPercentual).toFixed(2)}%`,
        },
      ],
    },
    {
      title: "3. Indicadores principais",
      rows: [
        { label: "Total de custos fixos:", value: brl(calculations.totalCustosFixos), emphasis: true },
        {
          label: "Custo variável por atleta:",
          value: brl(calculations.custoVariavelPorAtleta),
          emphasis: true,
        },
        { label: "Custo total estimado:", value: brl(calculations.custoTotalEstimado), emphasis: true },
        { label: "Break-even por inscrito:", value: brl(calculations.breakEvenInscritos), emphasis: true },
        { label: "Preço mínimo de inscrição:", value: brl(calculations.precoMinimoInscricao), emphasis: true },
        {
          label: "Preço recomendado para lucro:",
          value: brl(calculations.precoRecomendadoParaLucro),
          emphasis: true,
        },
        {
          label: "Lucro líquido por inscrição:",
          value: brl(calculations.lucroLiquidoEstimado),
          emphasis: true,
        },
      ],
    },
  ];

  const costRows = budget.items.map((item) => {
    const quantidade = Number(item.quantidade);
    const valorUnitario = Number(item.valorUnitario);
    const quantidadeEfetiva =
      item.tipoCusto === "VARIAVEL_ATLETA"
        ? quantidade * budget.metaInscritos
        : quantidade;
    const subtotal = quantidadeEfetiva * valorUnitario;

    return {
      nome: item.costItem.nome,
      quantidade: `${numberPt(quantidadeEfetiva)} ${item.costItem.unidade.toLowerCase()}`,
      valorUnitario: brl(valorUnitario),
      subtotal: brl(subtotal),
    };
  });

  const pdfBytes = await createBudgetPdfBuffer({
    title: "Orçamento do Evento",
    subtitle: `${event.nomeEvento} | ${event.cidade}/${event.estado}`,
    logoDataUrl: budget.logoDataUrl ?? undefined,
    sections: summarySections,
    costRows,
  });

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
