import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthToken, setAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  organizationName: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
    }

    const { organizationName, name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json({ error: "E-mail ja cadastrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.organization.create({
      data: {
        name: organizationName,
        users: {
          create: {
            name,
            email,
            passwordHash,
          },
        },
      },
      include: {
        users: {
          take: 1,
        },
      },
    });

    const user = result.users[0];

    const token = createAuthToken({
      userId: user.id,
      organizationId: result.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: result.id,
      },
    });

    setAuthCookie(response, token);

    return response;
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

