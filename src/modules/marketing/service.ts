import { prisma } from "@/lib/prisma";
import { defaultMarketingPackages } from "./default-packages";
import { MarketingPackageInput } from "./validation";

function serializeDeliverables(deliverables: string[]) {
  return JSON.stringify(deliverables);
}

function parseDeliverables(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export async function listMarketingPackagesByOrganization(organizationId: string) {
  const count = await prisma.marketingPackage.count({ where: { organizationId } });
  if (count === 0) {
    await prisma.marketingPackage.createMany({
      data: defaultMarketingPackages.map((pkg) => ({
        organizationId,
        nome: pkg.nome,
        descricao: pkg.descricao,
        entregaveis: serializeDeliverables([...pkg.entregaveis]),
        investimento: pkg.investimento,
        cronograma: pkg.cronograma,
        ordem: pkg.ordem,
      })),
    });
  }

  const packages = await prisma.marketingPackage.findMany({
    where: { organizationId },
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
  });

  return packages.map((pkg) => ({
    ...pkg,
    entregaveis: parseDeliverables(pkg.entregaveis),
  }));
}

export async function createMarketingPackageForOrganization(
  organizationId: string,
  input: MarketingPackageInput,
) {
  return prisma.marketingPackage.create({
    data: {
      organizationId,
      nome: input.nome,
      descricao: input.descricao || null,
      entregaveis: serializeDeliverables(input.entregaveis),
      investimento: input.investimento,
      cronograma: input.cronograma || null,
      ativo: input.ativo,
      ordem: input.ordem,
    },
  });
}

export async function updateMarketingPackageForOrganization(
  organizationId: string,
  packageId: string,
  input: Partial<MarketingPackageInput>,
) {
  return prisma.marketingPackage.updateMany({
    where: { id: packageId, organizationId },
    data: {
      ...(input.nome !== undefined ? { nome: input.nome } : {}),
      ...(input.descricao !== undefined ? { descricao: input.descricao || null } : {}),
      ...(input.entregaveis !== undefined
        ? { entregaveis: serializeDeliverables(input.entregaveis) }
        : {}),
      ...(input.investimento !== undefined ? { investimento: input.investimento } : {}),
      ...(input.cronograma !== undefined ? { cronograma: input.cronograma || null } : {}),
      ...(input.ativo !== undefined ? { ativo: input.ativo } : {}),
      ...(input.ordem !== undefined ? { ordem: input.ordem } : {}),
    },
  });
}

export async function deleteMarketingPackageForOrganization(
  organizationId: string,
  packageId: string,
) {
  return prisma.marketingPackage.deleteMany({
    where: { id: packageId, organizationId },
  });
}
