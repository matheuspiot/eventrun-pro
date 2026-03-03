import { NextRequest, NextResponse } from "next/server";
import { CostItem } from "@prisma/client";
import { getAuthFromRequest } from "@/lib/auth";
import {
  createCostItemForOrganization,
  listCostItemsByOrganization,
} from "@/modules/budget/cost-items.service";
import { costItemSchema } from "@/modules/budget/validation";

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const categoria = request.nextUrl.searchParams.get("categoria") ?? undefined;
  const search = request.nextUrl.searchParams.get("search") ?? undefined;

  const items = await listCostItemsByOrganization(auth.organizationId, {
    categoria,
    search,
  });

  return NextResponse.json({
    items: items.map((item: CostItem) => ({
      ...item,
      custoPadrao: item.custoPadrao.toString(),
      criadoEm: item.criadoEm.toISOString(),
      atualizadoEm: item.atualizadoEm.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = costItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const created = await createCostItemForOrganization(auth.organizationId, parsed.data);

  return NextResponse.json({
    item: {
      ...created,
      custoPadrao: created.custoPadrao.toString(),
      criadoEm: created.criadoEm.toISOString(),
      atualizadoEm: created.atualizadoEm.toISOString(),
    },
  });
}
