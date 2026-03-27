import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthToken, setAuthCookie } from "@/lib/auth";
import { toApiErrorMessage } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { defaultCostItemsSeed } from "@/modules/budget/default-cost-items";

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
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "E-mail ja cadastrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.organization.create({
      data: {
        name: organizationName,
        costItems: {
          create: defaultCostItemsSeed,
        },
        users: {
          create: {
            name,
            email: normalizedEmail,
            role: "ADMIN",
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
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: result.id,
        role: user.role,
      },
    });

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    return NextResponse.json({ error: toApiErrorMessage(error) }, { status: 500 });
  }
}
