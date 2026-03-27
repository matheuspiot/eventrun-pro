import { z } from "zod";

export const marketingPackageSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  descricao: z.string().trim().max(500).nullable().optional(),
  entregaveis: z.array(z.string().trim().min(1)).min(1),
  investimento: z.coerce.number().nonnegative(),
  cronograma: z.string().trim().max(800).nullable().optional(),
  ativo: z.boolean().default(true),
  ordem: z.coerce.number().int().min(0).default(0),
});

export type MarketingPackageInput = z.infer<typeof marketingPackageSchema>;
