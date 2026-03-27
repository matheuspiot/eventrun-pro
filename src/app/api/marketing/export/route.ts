import { NextRequest, NextResponse } from "next/server";
import { canAccessModule, getAuthFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMarketingProposalPdf } from "@/modules/marketing/pdf";
import { listMarketingPackagesByOrganization } from "@/modules/marketing/service";

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canAccessModule(auth.role, "marketing")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId é obrigatório" }, { status: 400 });
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizationId: auth.organizationId },
    select: {
      nomeEvento: true,
      cidade: true,
      estado: true,
      dataEvento: true,
      organizador: true,
      modalidades: true,
      distancias: true,
      patrocinadores: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const packages = await listMarketingPackagesByOrganization(auth.organizationId);
  const activePackages = packages.filter((pkg) => pkg.ativo);

  const bodyLines = [
    "1. Escopo da proposta",
    "Estrutura comercial para posicionar, divulgar e acelerar a captacao de inscritos e patrocinadores.",
    "",
    "2. Dados do evento",
    `Evento: ${event.nomeEvento}`,
    `Cidade: ${event.cidade}/${event.estado}`,
    `Data: ${new Date(event.dataEvento).toLocaleDateString("pt-BR")}`,
    `Organizador: ${event.organizador}`,
    `Modalidades: ${event.modalidades || "Não informado"}`,
    `Distâncias: ${event.distancias || "Não informado"}`,
    `Patrocinadores atuais: ${event.patrocinadores || "Não informado"}`,
    "",
    "3. Pacotes comerciais",
    ...activePackages.flatMap((pkg, index) => [
      `${index + 1}. Pacote ${pkg.nome}`,
      pkg.descricao || "Sem descrição complementar.",
      ...pkg.entregaveis.map((item) => `- ${item}`),
      `Investimento sugerido: ${Number(pkg.investimento).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}`,
      `Cronograma: ${pkg.cronograma || "A definir conforme a campanha."}`,
      "",
    ]),
    "4. Fechamento comercial",
    "A recomendação é alinhar escopo, aprovações, cronograma e metas de conversão antes do kickoff.",
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
