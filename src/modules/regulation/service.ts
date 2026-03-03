import { prisma } from "@/lib/prisma";
import { RegulationConfigInput } from "./types";

export async function getEventForRegulation(organizationId: string, eventId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, organizationId },
    select: {
      id: true,
      nomeEvento: true,
      dataEvento: true,
      cidade: true,
      estado: true,
      localLargada: true,
      organizador: true,
    },
  });
}

export async function getRegulationConfigByEvent(
  organizationId: string,
  eventId: string,
) {
  const event = await getEventForRegulation(organizationId, eventId);
  if (!event) {
    return null;
  }

  return prisma.regulationConfig.findUnique({
    where: { eventId },
  });
}

export async function upsertRegulationConfig(
  organizationId: string,
  input: RegulationConfigInput,
) {
  const event = await getEventForRegulation(organizationId, input.eventId);
  if (!event) {
    return { error: "Evento nao encontrado" as const };
  }

  const config = await prisma.regulationConfig.upsert({
    where: { eventId: input.eventId },
    create: {
      eventId: input.eventId,
      possuiKids: input.possuiKids,
      possuiChip: input.possuiChip,
      possuiPremiacaoDinheiro: input.possuiPremiacaoDinheiro,
      tempoLimiteMinutos: input.tempoLimiteMinutos,
      plataformaInscricao: input.plataformaInscricao,
      valorInscricao: input.valorInscricao,
      limiteVagas: input.limiteVagas,
      emailContato: input.emailContato,
      whatsappContato: input.whatsappContato,
      dataInicioInscricao: new Date(input.dataInicioInscricao),
      dataFimInscricao: new Date(input.dataFimInscricao),
    },
    update: {
      possuiKids: input.possuiKids,
      possuiChip: input.possuiChip,
      possuiPremiacaoDinheiro: input.possuiPremiacaoDinheiro,
      tempoLimiteMinutos: input.tempoLimiteMinutos,
      plataformaInscricao: input.plataformaInscricao,
      valorInscricao: input.valorInscricao,
      limiteVagas: input.limiteVagas,
      emailContato: input.emailContato,
      whatsappContato: input.whatsappContato,
      dataInicioInscricao: new Date(input.dataInicioInscricao),
      dataFimInscricao: new Date(input.dataFimInscricao),
    },
  });

  return { config };
}
