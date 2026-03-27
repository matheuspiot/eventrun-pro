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

function buildAgeRanges(config: RegulationConfigDto) {
  const ranges: string[] = [];
  const start = Math.max(1, config.faixaEtariaInicio);
  const end = Math.max(start, config.faixaEtariaFim);
  const interval = [2, 5, 10].includes(config.intervaloFaixaEtaria)
    ? config.intervaloFaixaEtaria
    : 5;

  let current = start;
  while (current <= end) {
    const rangeEnd = Math.min(end, current + interval - 1);
    if (rangeEnd >= end) {
      ranges.push(`${current}+`);
      break;
    }
    ranges.push(`${current} a ${rangeEnd}`);
    current += interval;
  }

  return ranges;
}

function getTemplateIntro(templateTipo: RegulationConfigDto["templateTipo"]) {
  switch (templateTipo) {
    case "TRAIL_RUN":
      return "Este regulamento foi estruturado para prova de trail run, com enfase em seguranca, autonomia e condicoes de percurso natural.";
    case "CORRIDA_KIDS":
      return "Este regulamento foi estruturado para corrida kids, com foco em seguranca, autorizacao do responsavel e experiencia infantil.";
    default:
      return "Este regulamento foi estruturado para corrida de rua, com foco em seguranca, operacao urbana e fluxo de atletas.";
  }
}

export function generateRegulationText(config: RegulationConfigDto, event: RegulationEventDto) {
  const ageRanges = buildAgeRanges(config);

  const sections: Array<{ title: string; lines: string[] }> = [
    {
      title: "Identificacao do Evento",
      lines: [
        getTemplateIntro(config.templateTipo),
        `A prova ${event.nomeEvento}, doravante denominada EVENTO, sera realizada em ${formatDate(event.dataEvento)}, em ${event.cidade}/${event.estado}, com largada em ${event.localLargada}.`,
        `A organizacao e responsabilidade tecnica e de ${event.organizador}.`,
      ],
    },
    {
      title: "Cronograma do Evento",
      lines: [
        "Os horarios oficiais de concentracao, largada e encerramento serao divulgados pelos canais oficiais.",
        `Tempo limite para conclusao do percurso principal: ${config.tempoLimiteMinutos} minutos.`,
        config.regrasGeraisExtra || "Demais orientacoes operacionais serao divulgadas em comunicados oficiais.",
      ],
    },
    {
      title: "Inscricoes",
      lines: [
        `Periodo de inscricao: ${formatDate(config.dataInicioInscricao)} a ${formatDate(config.dataFimInscricao)}.`,
        `Valor base da inscricao: ${brl(config.valorInscricao)}.`,
        `Limite tecnico de vagas: ${config.limiteVagas}.`,
        `Plataformas oficiais: ${config.plataformaInscricao.join(", ")}.`,
        config.permiteTransferencia
          ? "A organizacao permite transferencia de inscricao dentro das regras operacionais divulgadas."
          : "Nao sera permitida transferencia de inscricao apos a confirmacao do pagamento.",
        config.politicaCancelamento || "Politicas de cancelamento, reembolso e credito seguem as regras divulgadas pela organizacao e plataforma oficial.",
      ],
    },
    {
      title: "Participacao e Seguranca",
      lines: [
        "Ao participar, o atleta assume total responsabilidade pelos dados fornecidos e aceita integralmente este regulamento.",
        "O atleta declara estar apto fisicamente para participar do EVENTO.",
        config.exigeAtestadoMedico
          ? "A organizacao podera exigir atestado medico ou termo especifico, conforme categoria e perfil da prova."
          : "A apresentacao de atestado medico nao e obrigatoria, salvo exigencia legal ou tecnica superveniente.",
        config.possuiKids
          ? "O EVENTO possui modalidade kids, mediante autorizacao do responsavel legal."
          : "O EVENTO nao possui modalidade kids nesta edicao.",
      ],
    },
    {
      title: "Kit e Retirada",
      lines: [
        "A retirada do kit seguira datas, horarios e local divulgados pela organizacao.",
        config.kitDescricao ||
          (config.possuiChip
            ? "O kit padrao contem numero de peito e chip de cronometragem."
            : "O kit padrao contem numero de peito, sem chip de cronometragem."),
        config.permiteRetiradaTerceiros
          ? "A retirada por terceiros podera ocorrer mediante autorizacao e documentos exigidos pela organizacao."
          : "A retirada do kit sera pessoal, salvo excecoes formalmente aprovadas pela organizacao.",
        config.documentosObrigatorios ||
          "Os documentos obrigatorios para retirada serao divulgados nos canais oficiais do evento.",
      ],
    },
    {
      title: "Cronometragem e Classificacao",
      lines: [
        config.possuiChip
          ? "A cronometragem oficial sera realizada por chip eletronico."
          : "A cronometragem oficial nao utilizara chip eletronico.",
        "O numero de peito e de uso obrigatorio e deve permanecer visivel durante todo o percurso.",
        "Numero adulterado, danificado ou oculto pode acarretar desclassificacao.",
        "A classificacao oficial sera divulgada conforme criterio tecnico definido pela organizacao.",
      ],
    },
    {
      title: "Categorias por Faixa Etaria",
      lines: [
        `Configuracao de categorias: de ${config.faixaEtariaInicio} ate ${config.faixaEtariaFim} anos, em intervalos de ${config.intervaloFaixaEtaria}.`,
        `Faixas sugeridas: ${ageRanges.join(", ")}.`,
      ],
    },
    {
      title: "Premiacao",
      lines: config.possuiPremiacaoDinheiro
        ? [
            config.premiacaoDescricao ||
              "Havera premiacao em dinheiro conforme categorias e regras divulgadas no anexo tecnico.",
            "A liberacao da premiacao depende da homologacao oficial dos resultados.",
          ]
        : [
            config.premiacaoDescricao ||
              "Nao havera premiacao em dinheiro nesta edicao. Podem ser concedidos trofeus e medalhas conforme categorias oficiais.",
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
      const body = section.lines.filter(Boolean).map((line) => `- ${line}`).join("\n");
      return `${header}\n${body}`;
    })
    .join("\n\n");

  return `REGULAMENTO GERAL\n\n${structured}`;
}
