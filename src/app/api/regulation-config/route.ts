import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { regulationConfigSchema } from "@/modules/regulation/validation";
import {
  getRegulationConfigByEvent,
  upsertRegulationConfig,
} from "@/modules/regulation/service";

function serializeConfig(config: Awaited<ReturnType<typeof getRegulationConfigByEvent>>) {
  if (!config) {
    return null;
  }

  return {
    id: config.id,
    eventId: config.eventId,
    possuiKids: config.possuiKids,
    possuiChip: config.possuiChip,
    possuiPremiacaoDinheiro: config.possuiPremiacaoDinheiro,
    logoDataUrl: config.logoDataUrl,
    faixaEtariaInicio: config.faixaEtariaInicio,
    faixaEtariaFim: config.faixaEtariaFim,
    intervaloFaixaEtaria: config.intervaloFaixaEtaria,
    tempoLimiteMinutos: config.tempoLimiteMinutos,
    plataformaInscricao: config.plataformaInscricao,
    valorInscricao: config.valorInscricao.toString(),
    limiteVagas: config.limiteVagas,
    emailContato: config.emailContato,
    whatsappContato: config.whatsappContato,
    dataInicioInscricao: config.dataInicioInscricao.toISOString(),
    dataFimInscricao: config.dataFimInscricao.toISOString(),
    criadoEm: config.criadoEm.toISOString(),
    atualizadoEm: config.atualizadoEm.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId é obrigatório" }, { status: 400 });
  }

  const config = await getRegulationConfigByEvent(auth.organizationId, eventId);
  return NextResponse.json({ config: serializeConfig(config) });
}

export async function PUT(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = regulationConfigSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await upsertRegulationConfig(auth.organizationId, parsed.data);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ config: serializeConfig(result.config) });
}
