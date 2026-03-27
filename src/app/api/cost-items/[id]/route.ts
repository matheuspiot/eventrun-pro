import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import {
  deleteCostItemForOrganization,
  updateCostItemForOrganization,
} from "@/modules/budget/cost-items.service";
import { costItemSchema } from "@/modules/budget/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = costItemSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await updateCostItemForOrganization(auth.organizationId, id, parsed.data);

  if (updated.count === 0) {
    return NextResponse.json({ error: "Custo não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const removed = await deleteCostItemForOrganization(auth.organizationId, id);

  if (removed.count === 0) {
    return NextResponse.json({ error: "Custo não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
