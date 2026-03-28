type OperationSeedTask = {
  fase: string;
  titulo: string;
  descricao: string;
  ordem: number;
};

const replacements: Array<[string, string]> = [
  ["operacao", "operação"],
  ["basicas", "básicas"],
  ["ambulancia", "ambulância"],
  ["seguranca", "segurança"],
  ["aprovacoes", "aprovações"],
  ["Inscricoes", "Inscrições"],
  ["Producao", "Produção"],
  ["Execucao", "Execução"],
  ["Pos-prova", "Pós-prova"],
  ["numeracao", "numeração"],
  ["sinalizacao", "sinalização"],
  ["funcoes", "funções"],
  ["horarios", "horários"],
  ["relatorio", "relatório"],
  ["pendencias", "pendências"],
  ["periodo", "período"],
  ["inscricao", "inscrição"],
  ["percurso", "percurso"],
];

function applyReplacements(value: string) {
  return replacements.reduce((result, [from, to]) => result.replaceAll(from, to), value);
}

export function normalizeOperationTaskSeed<T extends OperationSeedTask>(task: T): T {
  return {
    ...task,
    fase: applyReplacements(task.fase),
    titulo: applyReplacements(task.titulo),
    descricao: applyReplacements(task.descricao),
  };
}

export const defaultOperationTasks = [
  {
    fase: "Planejamento",
    titulo: "Definir percurso e operação da prova",
    descricao: "Validar percurso, largada, chegada e necessidades básicas.",
    ordem: 10,
  },
  {
    fase: "Planejamento",
    titulo: "Fechar fornecedores principais",
    descricao: "Cronometragem, ambulância, segurança e estrutura.",
    ordem: 20,
  },
  {
    fase: "Comercial",
    titulo: "Revisar patrocinadores e contrapartidas",
    descricao: "Confirmar marcas, entregas e aprovações.",
    ordem: 30,
  },
  {
    fase: "Inscrições",
    titulo: "Conferir regulamento e período de inscrição",
    descricao: "Garantir texto final, datas e canais de contato.",
    ordem: 40,
  },
  {
    fase: "Produção",
    titulo: "Planejar kit, numeração e sinalização",
    descricao: "Organizar materiais, impressos e fluxo de entrega.",
    ordem: 50,
  },
  {
    fase: "Execução",
    titulo: "Montar plano de staff e briefing final",
    descricao: "Distribuir funções, horários e pontos de apoio.",
    ordem: 60,
  },
  {
    fase: "Pós-prova",
    titulo: "Fechar relatório e pendências finais",
    descricao: "Resultados, fotos, patrocinadores e aprendizado da prova.",
    ordem: 70,
  },
] as const;
