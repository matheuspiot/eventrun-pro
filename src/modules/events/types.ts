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
  modalidades: string | null;
  distancias: string | null;
  capacidadeMaxima: number | null;
  limiteTecnico: string | null;
  cronogramaResumo: string | null;
  patrocinadores: string | null;
  fornecedores: string | null;
  status: EventStatus;
  criadoEm: string;
  atualizadoEm: string;
};
