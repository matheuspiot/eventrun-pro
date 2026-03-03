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
  const sections: Array<{ title: string; body: string[] }> = [];

  sections.push({
    title: "Identidade do Evento",
    body: [
      `O evento ${event.nomeEvento} sera realizado em ${formatDate(event.dataEvento)}, na cidade de ${event.cidade}/${event.estado}, com largada em ${event.localLargada}.`,
      `A organizacao tecnica e responsabilidade de ${event.organizador}.`,
    ],
  });

  sections.push({
    title: "Modalidades e Regras de Participacao",
    body: [
      config.possuiKids
        ? "O evento contempla modalidade Kids, com supervisao obrigatoria de responsavel."
        : "O evento nao possui modalidade Kids nesta edicao.",
      `O tempo limite oficial para conclusao da prova e de ${config.tempoLimiteMinutos} minutos.`,
      config.possuiChip
        ? "A cronometragem sera realizada com chip eletronico."
        : "A cronometragem sera realizada sem chip eletronico, por controle oficial da organizacao.",
    ],
  });

  sections.push({
    title: "Inscricao",
    body: [
      `As inscricoes estarao abertas de ${formatDate(config.dataInicioInscricao)} ate ${formatDate(config.dataFimInscricao)}.`,
      `O valor base da inscricao e ${brl(config.valorInscricao)} por participante.`,
      `A capacidade maxima prevista para esta edicao e de ${config.limiteVagas} vagas.`,
      `Plataformas oficiais de inscricao: ${config.plataformaInscricao.join(", ")}.`,
    ],
  });

  sections.push({
    title: "Kit do Atleta",
    body: [
      "O kit sera disponibilizado conforme cronograma divulgado pela organizacao.",
      config.possuiChip
        ? "O kit inclui chip de cronometragem e numero de peito."
        : "O kit inclui numero de peito, sem fornecimento de chip eletronico.",
    ],
  });

  if (config.possuiPremiacaoDinheiro) {
    sections.push({
      title: "Premiacao",
      body: [
        "Havera premiacao em dinheiro para categorias previstas no anexo tecnico.",
        "O pagamento da premiacao seguira validacao oficial de resultados e regras de elegibilidade.",
      ],
    });
  } else {
    sections.push({
      title: "Premiacao",
      body: [
        "Nao havera premiacao em dinheiro nesta edicao.",
        "A organizacao podera oferecer trofeus e medalhas conforme categorias e regulamento tecnico.",
      ],
    });
  }

  sections.push({
    title: "Contatos Oficiais",
    body: [
      `Canal oficial por e-mail: ${config.emailContato}.`,
      `Canal oficial por WhatsApp: ${config.whatsappContato}.`,
      "Duvidas, recursos e comunicacoes formais devem ser realizados por um dos canais acima.",
    ],
  });

  const structured = sections
    .map((section, index) => {
      const header = `${index + 1}. ${section.title}`;
      const body = section.body.map((line) => `- ${line}`).join("\n");
      return `${header}\n${body}`;
    })
    .join("\n\n");

  return `REGULAMENTO OFICIAL\n\n${structured}`;
}
