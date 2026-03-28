import { NextRequest, NextResponse } from "next/server";
import { canAccessModule, getAuthFromRequest } from "@/lib/auth";
import {
  deleteMarketingPackageForOrganization,
  getMarketingPackageByIdForOrganization,
  updateMarketingPackageForOrganization,
} from "@/modules/marketing/service";
import { marketingPackageSchema } from "@/modules/marketing/validation";

function serializePackage(pkg: NonNullable<Awaited<ReturnType<typeof getMarketingPackageByIdForOrganization>>>) {
  return {
    ...pkg,
    investimento: pkg.investimento.toString(),
    criadoEm: pkg.criadoEm.toISOString(),
    atualizadoEm: pkg.atualizadoEm.toISOString(),
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canAccessModule(auth.role, "marketing")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = marketingPackageSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await updateMarketingPackageForOrganization(auth.organizationId, id, parsed.data);
  if (updated.count === 0) {
    return NextResponse.json({ error: "Pacote não encontrado" }, { status: 404 });
  }

  const pkg = await getMarketingPackageByIdForOrganization(auth.organizationId, id);
  if (!pkg) {
    return NextResponse.json({ error: "Pacote não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ package: serializePackage(pkg) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canAccessModule(auth.role, "marketing")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const removed = await deleteMarketingPackageForOrganization(auth.organizationId, id);
  if (removed.count === 0) {
    return NextResponse.json({ error: "Pacote não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
