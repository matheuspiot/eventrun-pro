import { EventStatus } from "@prisma/client";

export type EventDto = {
  id: string;
  organizationId: string;
  nomeEvento: string;
  dataEvento: string;
  cidade: string;
  estado: string;
  localLargada: string;
  organizador: string;
  cnpjOrganizador: string;
  status: EventStatus;
  criadoEm: string;
  atualizadoEm: string;
};
