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

export function generateRegulationText(
  config: RegulationConfigDto,
  event: RegulationEventDto,
) {
  const sections: Array<{ title: string; lines: string[] }> = [
    {
      title: "Da Prova",
      lines: [
        `A prova ${event.nomeEvento}, doravante denominada EVENTO, sera realizada em ${formatDate(event.dataEvento)}, em ${event.cidade}/${event.estado}, com largada em ${event.localLargada}.`,
        `A organizacao e responsabilidade tecnica e de ${event.organizador}.`,
      ],
    },
    {
      title: "Cronograma do Evento",
      lines: [
        "Os horarios oficiais de largada e concentracao serao divulgados pelos canais oficiais.",
        `Tempo limite para conclusao do percurso principal: ${config.tempoLimiteMinutos} minutos.`,
      ],
    },
    {
      title: "Regras Gerais",
      lines: [
        "Ao participar, o atleta assume total responsabilidade pelos dados fornecidos e aceita integralmente este regulamento.",
        "O atleta declara estar apto fisicamente para participacao no EVENTO.",
        config.possuiChip
          ? "A cronometragem oficial sera realizada por chip eletronico."
          : "A cronometragem oficial nao utilizara chip eletronico.",
      ],
    },
    {
      title: "Kit de Participacao",
      lines: [
        "A retirada do kit seguira datas, horarios e local divulgados pela organizacao.",
        config.possuiChip
          ? "O kit contem numero de peito e chip de cronometragem."
          : "O kit contem numero de peito, sem chip de cronometragem.",
        "Itens promocionais e brindes podem variar conforme disponibilidade dos patrocinadores.",
      ],
    },
    {
      title: "Regras de Participacao",
      lines: [
        config.possuiKids
          ? "O EVENTO possui modalidade Kids, mediante autorizacao do responsavel legal."
          : "O EVENTO nao possui modalidade Kids nesta edicao.",
        "A participacao e pessoal e intransferivel.",
        "A organizacao podera retirar do percurso atletas fora do tempo limite por seguranca operacional.",
      ],
    },
    {
      title: "Inscricoes",
      lines: [
        `Periodo de inscricao: ${formatDate(config.dataInicioInscricao)} a ${formatDate(config.dataFimInscricao)}.`,
        `Valor base da inscricao: ${brl(config.valorInscricao)}.`,
        `Limite tecnico de vagas: ${config.limiteVagas}.`,
        `Plataformas oficiais: ${config.plataformaInscricao.join(", ")}.`,
      ],
    },
    {
      title: "Retirada de Kit",
      lines: [
        "A retirada por terceiros podera ocorrer mediante autorizacao por escrito e documento das partes.",
      ],
    },
    {
      title: "Termo de Responsabilidade",
      lines: [
        "Ao se inscrever, o atleta declara estar de acordo com este regulamento e autoriza o uso de imagem para fins promocionais do evento.",
      ],
    },
    {
      title: "Chip e Numero de Peito",
      lines: [
        "O numero de peito e de uso obrigatorio e deve permanecer visivel durante todo o percurso.",
        "Numero adulterado, danificado ou oculto pode acarretar desclassificacao.",
      ],
    },
    {
      title: "Classificacao",
      lines: [
        "A classificacao oficial sera divulgada conforme criterio tecnico definido pela organizacao e equipe de cronometragem.",
      ],
    },
    {
      title: "Premiacao",
      lines: config.possuiPremiacaoDinheiro
        ? [
            "Havera premiacao em dinheiro conforme categorias e regras divulgadas no anexo tecnico.",
            "A liberacao da premiacao depende da homologacao oficial dos resultados.",
          ]
        : [
            "Nao havera premiacao em dinheiro nesta edicao.",
            "Podem ser concedidos trofeus e medalhas conforme categorias oficiais.",
          ],
    },
    {
      title: "Consideracoes Gerais",
      lines: [
        "A organizacao podera alterar este regulamento por necessidade tecnica, de seguranca ou por exigencia legal.",
        "Casos omissos serao resolvidos pela comissao organizadora.",
      ],
    },
    {
      title: "Contatos Oficiais",
      lines: [
        `E-mail: ${config.emailContato}.`,
        `WhatsApp: ${config.whatsappContato}.`,
        "Duvidas e comunicacoes oficiais devem ser feitas pelos canais acima.",
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
