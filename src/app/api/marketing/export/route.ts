import { NextRequest, NextResponse } from "next/server";
import { canAccessModule, getAuthFromRequest } from "@/lib/auth";
import { buildPdfFilename } from "@/lib/download-filename";
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

  const sections = [
    {
      title: "1. Escopo da proposta",
      description:
        "Estrutura comercial para posicionar, divulgar e acelerar a captação de inscritos e patrocinadores.",
      blocks: [
        {
          type: "paragraph" as const,
          text: "Este material organiza a oferta comercial do evento com leitura clara, destaque dos pacotes e visão objetiva do investimento.",
        },
      ],
    },
    {
      title: "2. Dados do evento",
      blocks: [
        {
          type: "facts" as const,
          items: [
            { label: "Evento:", value: event.nomeEvento },
            { label: "Cidade:", value: `${event.cidade}/${event.estado}` },
            { label: "Data:", value: new Date(event.dataEvento).toLocaleDateString("pt-BR") },
            { label: "Organizador:", value: event.organizador },
            { label: "Modalidades:", value: event.modalidades || "Não informado" },
            { label: "Distâncias:", value: event.distancias || "Não informado" },
            { label: "Patrocinadores atuais:", value: event.patrocinadores || "Não informado" },
          ],
        },
      ],
    },
    ...(
      activePackages.length > 0
        ? activePackages.map((pkg, index) => ({
            title: `3.${index + 1} Pacote ${pkg.nome}`,
            description: pkg.descricao || "Pacote estruturado para apresentação comercial do evento.",
            blocks: [
              {
                type: "highlight" as const,
                label: "Investimento sugerido",
                value: Number(pkg.investimento).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }),
              },
              {
                type: "paragraph" as const,
                text: `Cronograma: ${pkg.cronograma || "A definir conforme a campanha."}`,
              },
              {
                type: "bullets" as const,
                items: pkg.entregaveis.length > 0 ? pkg.entregaveis : ["Sem entregáveis cadastrados."],
              },
            ],
          }))
        : [
            {
              title: "3. Pacotes comerciais",
              blocks: [
                {
                  type: "paragraph" as const,
                  text: "Nenhum pacote ativo foi cadastrado para esta organização.",
                },
              ],
            },
          ]
    ),
    {
      title: "4. Fechamento comercial",
      blocks: [
        {
          type: "bullets" as const,
          items: [
            "Alinhar escopo final e entregáveis aprovados.",
            "Validar cronograma de ativações e materiais.",
            "Definir metas de conversão e próximos responsáveis.",
          ],
        },
      ],
    },
  ];

  const pdf = await createMarketingProposalPdf({
    title: "Proposta Comercial de Marketing",
    subtitle: `${event.nomeEvento} | ${event.cidade}/${event.estado}`,
    sections,
  });

  const filename = buildPdfFilename("proposta-comercial", event.nomeEvento, event.dataEvento);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
