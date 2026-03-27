import { NextRequest, NextResponse } from "next/server";
import { canAccessModule, getAuthFromRequest } from "@/lib/auth";
import {
  createMarketingPackageForOrganization,
  listMarketingPackagesByOrganization,
} from "@/modules/marketing/service";
import { marketingPackageSchema } from "@/modules/marketing/validation";

function serializePackage(pkg: Awaited<ReturnType<typeof listMarketingPackagesByOrganization>>[number]) {
  return {
    ...pkg,
    investimento: pkg.investimento.toString(),
    criadoEm: pkg.criadoEm.toISOString(),
    atualizadoEm: pkg.atualizadoEm.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }
  if (!canAccessModule(auth.role, "marketing")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const packages = await listMarketingPackagesByOrganization(auth.organizationId);
  return NextResponse.json({ packages: packages.map(serializePackage) });
}

export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }
  if (!canAccessModule(auth.role, "marketing")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = marketingPackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const created = await createMarketingPackageForOrganization(auth.organizationId, parsed.data);
  return NextResponse.json({
    package: {
      ...created,
      entregaveis: parsed.data.entregaveis,
      investimento: created.investimento.toString(),
      criadoEm: created.criadoEm.toISOString(),
      atualizadoEm: created.atualizadoEm.toISOString(),
    },
  });
}
