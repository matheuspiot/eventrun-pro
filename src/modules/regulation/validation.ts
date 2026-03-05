import { z } from "zod";

export const regulationConfigSchema = z
  .object({
    eventId: z.string().min(1, "Evento é obrigatório"),
    possuiKids: z.boolean(),
    possuiChip: z.boolean(),
    possuiPremiacaoDinheiro: z.boolean(),
    logoDataUrl: z
      .string()
      .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/, "Logo inválida")
      .max(1_500_000, "Logo muito grande")
      .nullable()
      .optional(),
    faixaEtariaInicio: z.coerce.number().int().min(1),
    faixaEtariaFim: z.coerce.number().int().min(1),
    intervaloFaixaEtaria: z.coerce
      .number()
      .int()
      .refine((value) => [2, 5, 10].includes(value), "Intervalo deve ser 2, 5 ou 10"),
    tempoLimiteMinutos: z.coerce.number().int().positive(),
    plataformaInscricao: z.array(z.string().min(1)).min(1),
    valorInscricao: z.coerce.number().nonnegative(),
    limiteVagas: z.coerce.number().int().positive(),
    emailContato: z.string().email(),
    whatsappContato: z.string().min(8),
    dataInicioInscricao: z.string().min(1),
    dataFimInscricao: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.faixaEtariaFim < value.faixaEtariaInicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["faixaEtariaFim"],
        message: "Faixa etária final deve ser maior ou igual ao início",
      });
    }
  });
