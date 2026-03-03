import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CostItemInput } from "./validation";

export async function listCostItemsByOrganization(
  organizationId: string,
  filters?: { categoria?: string; search?: string },
) {
  const where: Prisma.CostItemWhereInput = {
    organizationId,
    ...(filters?.categoria ? { categoria: filters.categoria as never } : {}),
    ...(filters?.search
      ? {
          nome: {
            contains: filters.search,
            mode: "insensitive",
          },
        }
      : {}),
  };

  return prisma.costItem.findMany({
    where,
    orderBy: { atualizadoEm: "desc" },
  });
}

export async function createCostItemForOrganization(
  organizationId: string,
  input: CostItemInput,
) {
  return prisma.costItem.create({
    data: {
      organizationId,
      nome: input.nome,
      categoria: input.categoria,
      tipoCusto: input.tipoCusto,
      unidade: input.unidade,
      custoPadrao: input.custoPadrao,
      descricao: input.descricao,
    },
  });
}

export async function updateCostItemForOrganization(
  organizationId: string,
  costItemId: string,
  input: Partial<CostItemInput>,
) {
  return prisma.costItem.updateMany({
    where: { id: costItemId, organizationId },
    data: {
      ...(input.nome ? { nome: input.nome } : {}),
      ...(input.categoria ? { categoria: input.categoria } : {}),
      ...(input.tipoCusto ? { tipoCusto: input.tipoCusto } : {}),
      ...(input.unidade ? { unidade: input.unidade } : {}),
      ...(typeof input.custoPadrao === "number"
        ? { custoPadrao: input.custoPadrao }
        : {}),
      ...(input.descricao !== undefined ? { descricao: input.descricao } : {}),
    },
  });
}

export async function deleteCostItemForOrganization(
  organizationId: string,
  costItemId: string,
) {
  return prisma.costItem.deleteMany({
    where: { id: costItemId, organizationId },
  });
}
