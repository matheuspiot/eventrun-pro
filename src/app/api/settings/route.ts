import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canAccessModule, getAuthFromRequest } from "@/lib/auth";
import { normalizeUsername, usernamePattern } from "@/lib/username";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  organizationName: z.string().min(2),
  userName: z.string().min(2),
  username: z.string().trim().regex(usernamePattern, "Usuário inválido"),
});

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canAccessModule(auth.role, "configuracoes")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const [organization, user] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, name: true, email: true, username: true, role: true },
    }),
  ]);

  if (!organization || !user) {
    return NextResponse.json({ error: "Dados de conta não encontrados" }, { status: 404 });
  }

  return NextResponse.json({
    organization: {
      ...organization,
      createdAt: organization.createdAt.toISOString(),
    },
    user,
  });
}

export async function PUT(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canAccessModule(auth.role, "configuracoes")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { organizationName, userName, username } = parsed.data;
  const normalizedUsername = normalizeUsername(username);

  const existingUsername = await prisma.user.findFirst({
    where: {
      username: normalizedUsername,
      NOT: { id: auth.userId },
    },
    select: { id: true },
  });

  if (existingUsername) {
    return NextResponse.json({ error: "Usuário já cadastrado" }, { status: 409 });
  }

  const [organization, user] = await prisma.$transaction([
    prisma.organization.update({
      where: { id: auth.organizationId },
      data: { name: organizationName.trim() },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.user.update({
      where: { id: auth.userId },
      data: {
        name: userName.trim(),
        username: normalizedUsername,
      },
      select: { id: true, name: true, email: true, username: true, role: true },
    }),
  ]);

  return NextResponse.json({
    organization: {
      ...organization,
      createdAt: organization.createdAt.toISOString(),
    },
    user,
  });
}
