import { prisma } from "@/lib/prisma";
import { EventBudgetInput } from "./event-budget.validation";

export async function getEventBudgetForOrganization(
  organizationId: string,
  eventId: string,
) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId },
    select: { id: true },
  });

  if (!event) {
    return null;
  }

  return prisma.eventBudget.findUnique({
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
  });
}

export async function saveEventBudgetForOrganization(
  organizationId: string,
  input: EventBudgetInput,
) {
  const event = await prisma.event.findFirst({
    where: { id: input.eventId, organizationId },
    select: { id: true },
  });

  if (!event) {
    return { error: "Evento não encontrado" as const };
  }

  const uniqueIds = Array.from(new Set(input.items.map((item) => item.costItemId)));
  const costItems = await prisma.costItem.findMany({
    where: {
      organizationId,
      id: { in: uniqueIds },
    },
    select: {
      id: true,
      tipoCusto: true,
    },
  });

  const costMap = new Map(costItems.map((item) => [item.id, item]));

  if (uniqueIds.some((id) => !costMap.has(id))) {
    return { error: "Um ou mais custos selecionados não pertencem à organização" as const };
  }

  const budget = await prisma.$transaction(async (tx) => {
    const upserted = await tx.eventBudget.upsert({
      where: { eventId: input.eventId },
      create: {
        eventId: input.eventId,
        logoDataUrl: input.logoDataUrl ?? null,
        metaInscritos: input.metaInscritos,
        patrocinioPrevisto: input.patrocinioPrevisto,
        lucroAlvoPercentual: input.lucroAlvoPercentual,
        taxaPlataformaPercentual: input.taxaPlataformaPercentual,
        impostoPercentual: input.impostoPercentual,
        taxaCancelamentoReembolsoPercentual:
          input.taxaCancelamentoReembolsoPercentual,
      },
      update: {
        logoDataUrl: input.logoDataUrl ?? null,
        metaInscritos: input.metaInscritos,
        patrocinioPrevisto: input.patrocinioPrevisto,
        lucroAlvoPercentual: input.lucroAlvoPercentual,
        taxaPlataformaPercentual: input.taxaPlataformaPercentual,
        impostoPercentual: input.impostoPercentual,
        taxaCancelamentoReembolsoPercentual:
          input.taxaCancelamentoReembolsoPercentual,
      },
      select: { id: true },
    });

    await tx.eventBudgetItem.deleteMany({
      where: { eventBudgetId: upserted.id },
    });

    if (input.items.length > 0) {
      await tx.eventBudgetItem.createMany({
        data: input.items.map((item) => ({
          eventBudgetId: upserted.id,
          costItemId: item.costItemId,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          tipoCusto: costMap.get(item.costItemId)!.tipoCusto,
        })),
      });
    }

    return tx.eventBudget.findUniqueOrThrow({
      where: { id: upserted.id },
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
    });
  });

  return { budget };
}
