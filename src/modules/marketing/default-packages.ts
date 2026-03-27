export const defaultMarketingPackages = [
  {
    nome: "Start",
    descricao: "Pacote de entrada para estrutura minima de divulgacao.",
    entregaveis: [
      "Diagnostico de marca",
      "Design de pecas",
      "Plano de conteudo 4 semanas",
    ],
    investimento: 3900,
    cronograma: "Kickoff, criacao visual e entrega do plano de conteudo inicial.",
    ordem: 10,
  },
  {
    nome: "Performance",
    descricao: "Pacote comercial com foco em captacao e aceleracao.",
    entregaveis: [
      "Tudo do Start",
      "Gestao de anuncios",
      "Relatorio quinzenal",
    ],
    investimento: 7500,
    cronograma: "Setup, campanhas de captacao, otimizacao quinzenal e leitura de resultados.",
    ordem: 20,
  },
  {
    nome: "Full Race",
    descricao: "Pacote completo com pre, durante e pos-evento.",
    entregaveis: [
      "Tudo do Performance",
      "Cobertura de prova",
      "Pos-evento com remarketing",
    ],
    investimento: 12900,
    cronograma: "Aquecimento, operacao de prova, cobertura e reaproveitamento comercial pos-evento.",
    ordem: 30,
  },
] as const;
