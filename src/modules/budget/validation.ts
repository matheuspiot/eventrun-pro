import { z } from "zod";

const categories = [
  "ESTRUTURA",
  "STAFF",
  "SEGURANCA",
  "MATERIAIS",
  "COMUNICACAO",
  "TAXAS",
  "LOGISTICA",
  "OUTROS",
] as const;

const costTypes = ["FIXO", "VARIAVEL_ATLETA", "VARIAVEL_UNIDADE"] as const;
const units = ["UN", "PESSOA", "HORA", "KM", "LOTE", "ATLETA"] as const;

export const costItemSchema = z.object({
  nome: z.string().min(2, "Nome e obrigatorio"),
  categoria: z.enum(categories),
  tipoCusto: z.enum(costTypes),
  unidade: z.enum(units),
  custoPadrao: z.coerce.number().positive("Custo deve ser maior que zero"),
  descricao: z.string().optional().nullable(),
});

export type CostItemInput = z.infer<typeof costItemSchema>;
