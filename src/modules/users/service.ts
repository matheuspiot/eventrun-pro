import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { CreateOrganizationUserInput, UpdateOrganizationUserInput } from "./validation";

export async function listOrganizationUsers(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      email: true,
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
    return { error: "E-mail ja cadastrado." } as const;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      organizationId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
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
  const updated = await prisma.user.updateMany({
    where: { id: userId, organizationId },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.role ? { role: input.role } : {}),
    },
  });

  return updated;
}

export async function deleteOrganizationUser(organizationId: string, userId: string) {
  return prisma.user.deleteMany({
    where: { id: userId, organizationId },
  });
}
