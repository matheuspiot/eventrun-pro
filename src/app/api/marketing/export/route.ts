import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMarketingProposalPdf } from "@/modules/marketing/pdf";

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId e obrigatorio" }, { status: 400 });
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: auth.organizationId },
    select: {
      nomeEvento: true,
      cidade: true,
      estado: true,
      dataEvento: true,
      organizador: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento nao encontrado" }, { status: 404 });
  }

  const bodyLines = [
    "1. Escopo da proposta",
    "Comunicacao visual completa da prova, planejamento de conteudo e operacao de campanhas.",
    "",
    "2. Entregaveis",
    "- Identidade visual digital da corrida",
    "- Plano de conteudo para 8 semanas",
    "- Gestao de anuncios para captacao de inscritos",
    "- Relatorios quinzenais com desempenho",
    "",
    "3. Cronograma sugerido",
    "T-90: abertura da campanha e landing page.",
    "T-60: aceleracao de midia paga e influenciadores locais.",
    "T-30: prova social, urgencia de lotes e retargeting.",
    "T-7: comunicacao final de logistica aos inscritos.",
    "",
    "4. Investimento",
    "Valor de referencia: sob consulta conforme escopo final e volume de entregas.",
    "",
    "5. Dados do evento",
    `Evento: ${event.nomeEvento}`,
    `Cidade: ${event.cidade}/${event.estado}`,
    `Data: ${new Date(event.dataEvento).toLocaleDateString("pt-BR")}`,
    `Organizador: ${event.organizador}`,
  ];

  const pdf = await createMarketingProposalPdf({
    title: "Proposta Comercial de Marketing",
    subtitle: `${event.nomeEvento} | ${event.cidade}/${event.estado}`,
    bodyLines,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=\"proposta-marketing-${eventId}.pdf\"`,
      "Cache-Control": "no-store",
    },
  });
}
