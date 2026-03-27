import { NextRequest, NextResponse } from "next/server";
import { canAccessModule, getAuthFromRequest } from "@/lib/auth";
import { deleteOrganizationUser, updateOrganizationUser } from "@/modules/users/service";
import { updateOrganizationUserSchema } from "@/modules/users/validation";

function forbid() {
  return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  if (!canAccessModule(auth.role, "configuracoes")) {
    return forbid();
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateOrganizationUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (auth.userId === id && parsed.data.role && parsed.data.role !== auth.role) {
    return NextResponse.json(
      { error: "Nao e permitido alterar o proprio papel por esta tela." },
      { status: 400 },
    );
  }

  const updated = await updateOrganizationUser(auth.organizationId, id, parsed.data);
  if (updated.count === 0) {
    return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  if (!canAccessModule(auth.role, "configuracoes")) {
    return forbid();
  }

  const { id } = await params;
  if (auth.userId === id) {
    return NextResponse.json(
      { error: "Nao e permitido remover o proprio usuario." },
      { status: 400 },
    );
  }

  const removed = await deleteOrganizationUser(auth.organizationId, id);
  if (removed.count === 0) {
    return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
