import { z } from "zod";

export const eventBudgetItemInputSchema = z.object({
  costItemId: z.string().min(1, "Cost item é obrigatório"),
  quantidade: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  valorUnitario: z.coerce.number().nonnegative("Valor unitário inválido"),
});

export const eventBudgetInputSchema = z.object({
  eventId: z.string().min(1, "Evento é obrigatório"),
  logoDataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/, "Logo inválida")
    .max(1_500_000, "Logo muito grande")
    .nullable()
    .optional(),
  metaInscritos: z.coerce.number().int().positive("Meta de inscritos inválida"),
  patrocinioPrevisto: z.coerce.number().nonnegative(),
  lucroAlvoPercentual: z.coerce.number().nonnegative(),
  taxaPlataformaPercentual: z.coerce.number().nonnegative(),
  impostoPercentual: z.coerce.number().nonnegative(),
  taxaCancelamentoReembolsoPercentual: z.coerce.number().nonnegative(),
  items: z.array(eventBudgetItemInputSchema),
});

export type EventBudgetInput = z.infer<typeof eventBudgetInputSchema>;
