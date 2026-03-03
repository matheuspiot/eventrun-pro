import { z } from "zod";

export const eventBudgetItemInputSchema = z.object({
  costItemId: z.string().min(1, "Cost item e obrigatorio"),
  quantidade: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  valorUnitario: z.coerce.number().nonnegative("Valor unitario invalido"),
});

export const eventBudgetInputSchema = z.object({
  eventId: z.string().min(1, "Evento e obrigatorio"),
  metaInscritos: z.coerce.number().int().positive("Meta de inscritos invalida"),
  patrocinioPrevisto: z.coerce.number().nonnegative(),
  lucroAlvoPercentual: z.coerce.number().nonnegative(),
  taxaPlataformaPercentual: z.coerce.number().nonnegative(),
  impostoPercentual: z.coerce.number().nonnegative(),
  taxaCancelamentoReembolsoPercentual: z.coerce.number().nonnegative(),
  items: z.array(eventBudgetItemInputSchema),
});

export type EventBudgetInput = z.infer<typeof eventBudgetInputSchema>;
