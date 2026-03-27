export type OperationTaskDto = {
  id: string;
  eventId: string;
  fase: string;
  titulo: string;
  descricao: string | null;
  responsavel: string | null;
  prazo: string | null;
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA";
  observacoes: string | null;
  ordem: number;
  criadoEm: string;
  atualizadoEm: string;
};
