import { RegulationConfigDto, RegulationEventDto } from "./types";

function formatDate(dateInput: string) {
  const date = new Date(dateInput);
  return Number.isNaN(date.getTime())
    ? dateInput
    : date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function brl(value: string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function generateRegulationText(config: RegulationConfigDto, event: RegulationEventDto) {
  const sections: Array<{ title: string; lines: string[] }> = [
    {
      title: "Da Prova",
      lines: [
        `A prova ${event.nomeEvento}, doravante denominada EVENTO, será realizada em ${formatDate(event.dataEvento)}, em ${event.cidade}/${event.estado}, com largada em ${event.localLargada}.`,
        `A organização e responsabilidade técnica é de ${event.organizador}.`,
      ],
    },
    {
      title: "Cronograma do Evento",
      lines: [
        "Os horários oficiais de largada e concentração serão divulgados pelos canais oficiais.",
        `Tempo limite para conclusão do percurso principal: ${config.tempoLimiteMinutos} minutos.`,
      ],
    },
    {
      title: "Regras Gerais",
      lines: [
        "Ao participar, o atleta assume total responsabilidade pelos dados fornecidos e aceita integralmente este regulamento.",
        "O atleta declara estar apto fisicamente para participação no EVENTO.",
        config.possuiChip
          ? "A cronometragem oficial será realizada por chip eletrônico."
          : "A cronometragem oficial não utilizará chip eletrônico.",
      ],
    },
    {
      title: "Kit de Participação",
      lines: [
        "A retirada do kit seguirá datas, horários e local divulgados pela organização.",
        config.possuiChip
          ? "O kit contém número de peito e chip de cronometragem."
          : "O kit contém número de peito, sem chip de cronometragem.",
        "Itens promocionais e brindes podem variar conforme disponibilidade dos patrocinadores.",
      ],
    },
    {
      title: "Regras de Participação",
      lines: [
        config.possuiKids
          ? "O EVENTO possui modalidade Kids, mediante autorização do responsável legal."
          : "O EVENTO não possui modalidade Kids nesta edição.",
        "A participação é pessoal e intransferível.",
        "A organização poderá retirar do percurso atletas fora do tempo limite por segurança operacional.",
      ],
    },
    {
      title: "Inscrições",
      lines: [
        `Período de inscrição: ${formatDate(config.dataInicioInscricao)} a ${formatDate(config.dataFimInscricao)}.`,
        `Valor base da inscrição: ${brl(config.valorInscricao)}.`,
        `Limite técnico de vagas: ${config.limiteVagas}.`,
        `Plataformas oficiais: ${config.plataformaInscricao.join(", ")}.`,
      ],
    },
    {
      title: "Retirada de Kit",
      lines: [
        "A retirada por terceiros poderá ocorrer mediante autorização por escrito e documento das partes.",
      ],
    },
    {
      title: "Termo de Responsabilidade",
      lines: [
        "Ao se inscrever, o atleta declara estar de acordo com este regulamento e autoriza o uso de imagem para fins promocionais do evento.",
      ],
    },
    {
      title: "Chip e Número de Peito",
      lines: [
        "O número de peito é de uso obrigatório e deve permanecer visível durante todo o percurso.",
        "Número adulterado, danificado ou oculto pode acarretar desclassificação.",
      ],
    },
    {
      title: "Classificação",
      lines: [
        "A classificação oficial será divulgada conforme critério técnico definido pela organização e equipe de cronometragem.",
      ],
    },
    {
      title: "Premiação",
      lines: config.possuiPremiacaoDinheiro
        ? [
            "Haverá premiação em dinheiro conforme categorias e regras divulgadas no anexo técnico.",
            "A liberação da premiação depende da homologação oficial dos resultados.",
          ]
        : [
            "Não haverá premiação em dinheiro nesta edição.",
            "Podem ser concedidos troféus e medalhas conforme categorias oficiais.",
          ],
    },
    {
      title: "Considerações Gerais",
      lines: [
        "A organização poderá alterar este regulamento por necessidade técnica, de segurança ou por exigência legal.",
        "Casos omissos serão resolvidos pela comissão organizadora.",
      ],
    },
    {
      title: "Contatos Oficiais",
      lines: [
        `E-mail: ${config.emailContato}.`,
        `WhatsApp: ${config.whatsappContato}.`,
        "Dúvidas e comunicações oficiais devem ser feitas pelos canais acima.",
      ],
    },
  ];

  const structured = sections
    .map((section, index) => {
      const header = `${index + 1}. ${section.title}`;
      const body = section.lines.map((line) => `- ${line}`).join("\n");
      return `${header}\n${body}`;
    })
    .join("\n\n");

  return `REGULAMENTO GERAL\n\n${structured}`;
}
