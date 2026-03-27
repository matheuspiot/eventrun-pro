import { z } from "zod";

export const operationTaskSchema = z.object({
  eventId: z.string().min(1, "Evento e obrigatorio"),
  fase: z.string().trim().min(2, "Fase e obrigatoria").max(80),
  titulo: z.string().trim().min(2, "Titulo e obrigatorio").max(120),
  descricao: z.string().trim().max(500).nullable().optional(),
  responsavel: z.string().trim().max(120).nullable().optional(),
  prazo: z.string().nullable().optional(),
  status: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA"]).default("PENDENTE"),
  observacoes: z.string().trim().max(800).nullable().optional(),
  ordem: z.coerce.number().int().min(0).default(0),
});

export type OperationTaskInput = z.infer<typeof operationTaskSchema>;
