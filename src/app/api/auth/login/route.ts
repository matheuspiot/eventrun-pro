import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthToken, setAuthCookie } from "@/lib/auth";
import { toApiErrorMessage } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 });
    }

    const token = createAuthToken({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: user.organizationId,
      },
    });

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    return NextResponse.json({ error: toApiErrorMessage(error) }, { status: 500 });
  }
}
