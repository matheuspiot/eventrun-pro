import { prisma } from "@/lib/prisma";
import { OperationTaskInput } from "./validation";
import { defaultOperationTasks } from "./default-tasks";

async function ensureEventBelongsToOrganization(organizationId: string, eventId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, organizationId },
    select: { id: true },
  });
}

export async function listOperationTasksByEvent(
  organizationId: string,
  eventId: string,
) {
  const event = await ensureEventBelongsToOrganization(organizationId, eventId);
  if (!event) {
    return null;
  }

  const count = await prisma.eventOperationTask.count({ where: { eventId } });
  if (count === 0) {
    await prisma.eventOperationTask.createMany({
      data: defaultOperationTasks.map((task) => ({
        eventId,
        fase: task.fase,
        titulo: task.titulo,
        descricao: task.descricao,
        ordem: task.ordem,
      })),
    });
  }

  return prisma.eventOperationTask.findMany({
    where: { eventId },
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
  });
}

export async function createOperationTaskForEvent(
  organizationId: string,
  input: OperationTaskInput,
) {
  const event = await ensureEventBelongsToOrganization(organizationId, input.eventId);
  if (!event) {
    return { error: "Evento nao encontrado" as const };
  }

  const task = await prisma.eventOperationTask.create({
    data: {
      eventId: input.eventId,
      fase: input.fase,
      titulo: input.titulo,
      descricao: input.descricao || null,
      responsavel: input.responsavel || null,
      prazo: input.prazo ? new Date(input.prazo) : null,
      status: input.status,
      observacoes: input.observacoes || null,
      ordem: input.ordem,
    },
  });

  return { task };
}

export async function updateOperationTaskForOrganization(
  organizationId: string,
  taskId: string,
  input: Partial<OperationTaskInput>,
) {
  const current = await prisma.eventOperationTask.findUnique({
    where: { id: taskId },
    select: { id: true, eventId: true },
  });

  if (!current) {
    return { error: "Tarefa nao encontrada" as const };
  }

  const event = await ensureEventBelongsToOrganization(organizationId, current.eventId);
  if (!event) {
    return { error: "Tarefa nao encontrada" as const };
  }

  const task = await prisma.eventOperationTask.update({
    where: { id: taskId },
    data: {
      ...(input.fase !== undefined ? { fase: input.fase } : {}),
      ...(input.titulo !== undefined ? { titulo: input.titulo } : {}),
      ...(input.descricao !== undefined ? { descricao: input.descricao || null } : {}),
      ...(input.responsavel !== undefined ? { responsavel: input.responsavel || null } : {}),
      ...(input.prazo !== undefined ? { prazo: input.prazo ? new Date(input.prazo) : null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.observacoes !== undefined ? { observacoes: input.observacoes || null } : {}),
      ...(input.ordem !== undefined ? { ordem: input.ordem } : {}),
    },
  });

  return { task };
}

export async function deleteOperationTaskForOrganization(
  organizationId: string,
  taskId: string,
) {
  const current = await prisma.eventOperationTask.findUnique({
    where: { id: taskId },
    select: { id: true, eventId: true },
  });

  if (!current) {
    return { count: 0 };
  }

  const event = await ensureEventBelongsToOrganization(organizationId, current.eventId);
  if (!event) {
    return { count: 0 };
  }

  return prisma.eventOperationTask.deleteMany({
    where: { id: taskId },
  });
}
