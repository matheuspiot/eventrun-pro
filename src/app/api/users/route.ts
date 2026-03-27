import { NextRequest, NextResponse } from "next/server";
import { canAccessModule, getAuthFromRequest } from "@/lib/auth";
import { createOrganizationUserSchema } from "@/modules/users/validation";
import {
  createOrganizationUser,
  listOrganizationUsers,
} from "@/modules/users/service";

function forbid() {
  return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
}

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  if (!canAccessModule(auth.role, "configuracoes")) {
    return forbid();
  }

  const users = await listOrganizationUsers(auth.organizationId);
  return NextResponse.json({
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  if (!canAccessModule(auth.role, "configuracoes")) {
    return forbid();
  }

  const body = await request.json();
  const parsed = createOrganizationUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createOrganizationUser(auth.organizationId, parsed.data);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({
    user: {
      ...result.user,
      createdAt: result.user.createdAt.toISOString(),
    },
  });
}
