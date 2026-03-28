import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthToken, setAuthCookie } from "@/lib/auth";
import { toApiErrorMessage } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { normalizeUsername } from "@/lib/username";

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { identifier, password } = parsed.data;
    const normalizedIdentifier = identifier.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          { username: normalizeUsername(normalizedIdentifier) },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const token = createAuthToken({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        organizationId: user.organizationId,
        role: user.role,
      },
    });

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    return NextResponse.json({ error: toApiErrorMessage(error) }, { status: 500 });
  }
}
