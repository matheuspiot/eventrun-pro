import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  organizationName: z.string().min(2),
  userName: z.string().min(2),
});

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const [organization, user] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!organization || !user) {
    return NextResponse.json({ error: "Dados de conta nao encontrados" }, { status: 404 });
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
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { organizationName, userName } = parsed.data;

  const [organization, user] = await prisma.$transaction([
    prisma.organization.update({
      where: { id: auth.organizationId },
      data: { name: organizationName.trim() },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.user.update({
      where: { id: auth.userId },
      data: { name: userName.trim() },
      select: { id: true, name: true, email: true },
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
