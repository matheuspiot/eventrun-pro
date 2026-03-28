import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeUsername } from "@/lib/username";
import { CreateOrganizationUserInput, UpdateOrganizationUserInput } from "./validation";

export async function listOrganizationUsers(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function createOrganizationUser(
  organizationId: string,
  input: CreateOrganizationUserInput,
) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.trim().toLowerCase() },
    select: { id: true },
  });

  if (existingUser) {
    return { error: "E-mail já cadastrado." } as const;
  }

  const existingUsername = await prisma.user.findFirst({
    where: { username: normalizeUsername(input.username) },
    select: { id: true },
  });

  if (existingUsername) {
    return { error: "Usuário já cadastrado." } as const;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      organizationId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      username: normalizeUsername(input.username),
      role: input.role,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  return { user } as const;
}

export async function updateOrganizationUser(
  organizationId: string,
  userId: string,
  input: UpdateOrganizationUserInput,
) {
  if (input.username) {
    const username = normalizeUsername(input.username);
    const existingUsername = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: userId },
      },
      select: { id: true },
    });

    if (existingUsername) {
      return { error: "Usuário já cadastrado." } as const;
    }
  }

  const updated = await prisma.user.updateMany({
    where: { id: userId, organizationId },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.username ? { username: normalizeUsername(input.username) } : {}),
      ...(input.role ? { role: input.role } : {}),
    },
  });

  return { count: updated.count } as const;
}

export async function deleteOrganizationUser(organizationId: string, userId: string) {
  return prisma.user.deleteMany({
    where: { id: userId, organizationId },
  });
}
