import { prisma } from "@/lib/prisma";
import { RegulationConfigInput } from "./types";

function serializePlatforms(platforms: string[]) {
  return JSON.stringify(platforms);
}

function parsePlatforms(raw: string | null | undefined) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

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

export async function getRegulationConfigByEvent(organizationId: string, eventId: string) {
  const event = await getEventForRegulation(organizationId, eventId);
  if (!event) {
    return null;
  }

  const config = await prisma.regulationConfig.findUnique({
    where: { eventId },
  });

  if (!config) {
    return null;
  }

  return {
    ...config,
    plataformaInscricao: parsePlatforms(config.plataformaInscricao),
  };
}

export async function upsertRegulationConfig(
  organizationId: string,
  input: RegulationConfigInput,
) {
  const event = await getEventForRegulation(organizationId, input.eventId);
  if (!event) {
    return { error: "Evento não encontrado" as const };
  }

  const config = await prisma.regulationConfig.upsert({
    where: { eventId: input.eventId },
    create: {
      eventId: input.eventId,
      templateTipo: input.templateTipo,
      possuiKids: input.possuiKids,
      possuiChip: input.possuiChip,
      possuiPremiacaoDinheiro: input.possuiPremiacaoDinheiro,
      permiteTransferencia: input.permiteTransferencia,
      permiteRetiradaTerceiros: input.permiteRetiradaTerceiros,
      exigeAtestadoMedico: input.exigeAtestadoMedico,
      logoDataUrl: input.logoDataUrl ?? null,
      faixaEtariaInicio: input.faixaEtariaInicio,
      faixaEtariaFim: input.faixaEtariaFim,
      intervaloFaixaEtaria: input.intervaloFaixaEtaria,
      tempoLimiteMinutos: input.tempoLimiteMinutos,
      plataformaInscricao: serializePlatforms(input.plataformaInscricao),
      valorInscricao: input.valorInscricao,
      limiteVagas: input.limiteVagas,
      kitDescricao: input.kitDescricao || null,
      premiacaoDescricao: input.premiacaoDescricao || null,
      regrasGeraisExtra: input.regrasGeraisExtra || null,
      documentosObrigatorios: input.documentosObrigatorios || null,
      politicaCancelamento: input.politicaCancelamento || null,
      emailContato: input.emailContato,
      whatsappContato: input.whatsappContato,
      dataInicioInscricao: new Date(input.dataInicioInscricao),
      dataFimInscricao: new Date(input.dataFimInscricao),
    },
    update: {
      templateTipo: input.templateTipo,
      possuiKids: input.possuiKids,
      possuiChip: input.possuiChip,
      possuiPremiacaoDinheiro: input.possuiPremiacaoDinheiro,
      permiteTransferencia: input.permiteTransferencia,
      permiteRetiradaTerceiros: input.permiteRetiradaTerceiros,
      exigeAtestadoMedico: input.exigeAtestadoMedico,
      logoDataUrl: input.logoDataUrl ?? null,
      faixaEtariaInicio: input.faixaEtariaInicio,
      faixaEtariaFim: input.faixaEtariaFim,
      intervaloFaixaEtaria: input.intervaloFaixaEtaria,
      tempoLimiteMinutos: input.tempoLimiteMinutos,
      plataformaInscricao: serializePlatforms(input.plataformaInscricao),
      valorInscricao: input.valorInscricao,
      limiteVagas: input.limiteVagas,
      kitDescricao: input.kitDescricao || null,
      premiacaoDescricao: input.premiacaoDescricao || null,
      regrasGeraisExtra: input.regrasGeraisExtra || null,
      documentosObrigatorios: input.documentosObrigatorios || null,
      politicaCancelamento: input.politicaCancelamento || null,
      emailContato: input.emailContato,
      whatsappContato: input.whatsappContato,
      dataInicioInscricao: new Date(input.dataInicioInscricao),
      dataFimInscricao: new Date(input.dataFimInscricao),
    },
  });

  return {
    config: {
      ...config,
      plataformaInscricao: parsePlatforms(config.plataformaInscricao),
    },
  };
}
