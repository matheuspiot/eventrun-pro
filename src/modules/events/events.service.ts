import { prisma } from "@/lib/prisma";
import { EventFormInput } from "./validation";

export async function listEventsByOrganization(organizationId: string) {
  return prisma.event.findMany({
    where: { organizationId },
    orderBy: { dataEvento: "asc" },
  });
}

export async function createEventForOrganization(
  organizationId: string,
  input: EventFormInput,
) {
  return prisma.event.create({
    data: {
      organizationId,
      nomeEvento: input.nomeEvento,
      dataEvento: new Date(input.dataEvento),
      cidade: input.cidade,
      estado: input.estado,
      localLargada: input.localLargada,
      organizador: input.organizador,
      cnpjOrganizador: input.cnpjOrganizador,
      status: input.status,
    },
  });
}

export async function updateEventForOrganization(
  organizationId: string,
  eventId: string,
  input: Partial<EventFormInput>,
) {
  return prisma.event.updateMany({
    where: { id: eventId, organizationId },
    data: {
      ...(input.nomeEvento ? { nomeEvento: input.nomeEvento } : {}),
      ...(input.dataEvento ? { dataEvento: new Date(input.dataEvento) } : {}),
      ...(input.cidade ? { cidade: input.cidade } : {}),
      ...(input.estado ? { estado: input.estado } : {}),
      ...(input.localLargada ? { localLargada: input.localLargada } : {}),
      ...(input.organizador ? { organizador: input.organizador } : {}),
      ...(input.cnpjOrganizador
        ? { cnpjOrganizador: input.cnpjOrganizador }
        : {}),
      ...(input.status ? { status: input.status } : {}),
    },
  });
}

export async function deleteEventForOrganization(
  organizationId: string,
  eventId: string,
) {
  return prisma.event.deleteMany({
    where: { id: eventId, organizationId },
  });
}
