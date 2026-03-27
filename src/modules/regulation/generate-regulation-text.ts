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
      return "Este regulamento foi estruturado para prova de trail run, com ênfase em segurança, autonomia e condições de percurso natural.";
    case "CORRIDA_KIDS":
      return "Este regulamento foi estruturado para corrida kids, com foco em segurança, autorização do responsável e experiência infantil.";
    default:
      return "Este regulamento foi estruturado para corrida de rua, com foco em segurança, operação urbana e fluxo de atletas.";
  }
}

export function generateRegulationText(config: RegulationConfigDto, event: RegulationEventDto) {
  const ageRanges = buildAgeRanges(config);

  const sections: Array<{ title: string; lines: string[] }> = [
    {
      title: "Identificação do Evento",
      lines: [
        getTemplateIntro(config.templateTipo),
        `A prova ${event.nomeEvento}, doravante denominada EVENTO, será realizada em ${formatDate(event.dataEvento)}, em ${event.cidade}/${event.estado}, com largada em ${event.localLargada}.`,
        `A organização e responsabilidade técnica é de ${event.organizador}.`,
      ],
    },
    {
      title: "Cronograma do Evento",
      lines: [
        "Os horários oficiais de concentração, largada e encerramento serão divulgados pelos canais oficiais.",
        `Tempo limite para conclusão do percurso principal: ${config.tempoLimiteMinutos} minutos.`,
        config.regrasGeraisExtra || "Demais orientações operacionais serão divulgadas em comunicados oficiais.",
      ],
    },
    {
      title: "Inscrições",
      lines: [
        `Período de inscrição: ${formatDate(config.dataInicioInscricao)} a ${formatDate(config.dataFimInscricao)}.`,
        `Valor base da inscrição: ${brl(config.valorInscricao)}.`,
        `Limite técnico de vagas: ${config.limiteVagas}.`,
        `Plataformas oficiais: ${config.plataformaInscricao.join(", ")}.`,
        config.permiteTransferencia
          ? "A organização permite transferência de inscrição dentro das regras operacionais divulgadas."
          : "Não será permitida transferência de inscrição após a confirmação do pagamento.",
        config.politicaCancelamento || "Políticas de cancelamento, reembolso e crédito seguem as regras divulgadas pela organização e plataforma oficial.",
      ],
    },
    {
      title: "Participação e Segurança",
      lines: [
        "Ao participar, o atleta assume total responsabilidade pelos dados fornecidos e aceita integralmente este regulamento.",
        "O atleta declara estar apto fisicamente para participar do EVENTO.",
        config.exigeAtestadoMedico
          ? "A organização poderá exigir atestado médico ou termo específico, conforme categoria e perfil da prova."
          : "A apresentação de atestado médico não é obrigatória, salvo exigência legal ou técnica superveniente.",
        config.possuiKids
          ? "O EVENTO possui modalidade kids, mediante autorização do responsável legal."
          : "O EVENTO não possui modalidade kids nesta edição.",
      ],
    },
    {
      title: "Kit e Retirada",
      lines: [
        "A retirada do kit seguirá datas, horários e local divulgados pela organização.",
        config.kitDescricao ||
          (config.possuiChip
            ? "O kit padrão contém número de peito e chip de cronometragem."
            : "O kit padrão contém número de peito, sem chip de cronometragem."),
        config.permiteRetiradaTerceiros
          ? "A retirada por terceiros poderá ocorrer mediante autorização e documentos exigidos pela organização."
          : "A retirada do kit será pessoal, salvo exceções formalmente aprovadas pela organização.",
        config.documentosObrigatorios ||
          "Os documentos obrigatórios para retirada serão divulgados nos canais oficiais do evento.",
      ],
    },
    {
      title: "Cronometragem e Classificação",
      lines: [
        config.possuiChip
          ? "A cronometragem oficial será realizada por chip eletrônico."
          : "A cronometragem oficial não utilizará chip eletrônico.",
        "O número de peito é de uso obrigatório e deve permanecer visível durante todo o percurso.",
        "Número adulterado, danificado ou oculto pode acarretar desclassificação.",
        "A classificação oficial será divulgada conforme critério técnico definido pela organização.",
      ],
    },
    {
      title: "Categorias por Faixa Etária",
      lines: [
        `Configuração de categorias: de ${config.faixaEtariaInicio} até ${config.faixaEtariaFim} anos, em intervalos de ${config.intervaloFaixaEtaria}.`,
        `Faixas sugeridas: ${ageRanges.join(", ")}.`,
      ],
    },
    {
      title: "Premiação",
      lines: config.possuiPremiacaoDinheiro
        ? [
            config.premiacaoDescricao ||
              "Haverá premiação em dinheiro conforme categorias e regras divulgadas no anexo técnico.",
            "A liberação da premiação depende da homologação oficial dos resultados.",
          ]
        : [
            config.premiacaoDescricao ||
              "Não haverá premiação em dinheiro nesta edição. Podem ser concedidos troféus e medalhas conforme categorias oficiais.",
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
      const body = section.lines.filter(Boolean).map((line) => `- ${line}`).join("\n");
      return `${header}\n${body}`;
    })
    .join("\n\n");

  return `REGULAMENTO GERAL\n\n${structured}`;
}
