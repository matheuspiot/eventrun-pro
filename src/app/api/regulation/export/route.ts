import { NextRequest, NextResponse } from "next/server";
import { canAccessModule, getAuthFromRequest } from "@/lib/auth";
import { generateRegulationText } from "@/modules/regulation/generate-regulation-text";
import { createRegulationPdfBuffer } from "@/modules/regulation/pdf";
import { RegulationTemplateType } from "@/modules/regulation/types";
import { getEventForRegulation, getRegulationConfigByEvent } from "@/modules/regulation/service";

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canAccessModule(auth.role, "regulamento")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId é obrigatório" }, { status: 400 });
  }

  const [event, config] = await Promise.all([
    getEventForRegulation(auth.organizationId, eventId),
    getRegulationConfigByEvent(auth.organizationId, eventId),
  ]);

  if (!event || !config) {
    return NextResponse.json(
      { error: "Evento ou configuração de regulamento não encontrado" },
      { status: 404 },
    );
  }

  const text = generateRegulationText(
    {
      ...config,
      templateTipo: config.templateTipo as RegulationTemplateType,
      valorInscricao: config.valorInscricao.toString(),
      dataInicioInscricao: config.dataInicioInscricao.toISOString(),
      dataFimInscricao: config.dataFimInscricao.toISOString(),
      criadoEm: config.criadoEm.toISOString(),
      atualizadoEm: config.atualizadoEm.toISOString(),
    },
    {
      ...event,
      dataEvento: event.dataEvento.toISOString(),
    },
  );

  const pdfBytes = await createRegulationPdfBuffer(
    "Regulamento Oficial",
    `${event.nomeEvento} | ${event.cidade}/${event.estado}`,
    text,
    config.logoDataUrl ?? undefined,
  );
  const normalizedBytes = new Uint8Array(pdfBytes.length);
  normalizedBytes.set(pdfBytes);
  const pdfBlob = new Blob([normalizedBytes], { type: "application/pdf" });

  return new NextResponse(pdfBlob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="regulamento-${eventId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
