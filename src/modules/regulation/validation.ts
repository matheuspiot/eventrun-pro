import { z } from "zod";

export const regulationConfigSchema = z
  .object({
    eventId: z.string().min(1, "Evento e obrigatorio"),
    templateTipo: z.enum(["CORRIDA_RUA", "TRAIL_RUN", "CORRIDA_KIDS"]),
    possuiKids: z.boolean(),
    possuiChip: z.boolean(),
    possuiPremiacaoDinheiro: z.boolean(),
    permiteTransferencia: z.boolean(),
    permiteRetiradaTerceiros: z.boolean(),
    exigeAtestadoMedico: z.boolean(),
    logoDataUrl: z
      .string()
      .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/, "Logo invalida")
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
    kitDescricao: z.string().trim().max(1000).nullable().optional(),
    premiacaoDescricao: z.string().trim().max(1000).nullable().optional(),
    regrasGeraisExtra: z.string().trim().max(1500).nullable().optional(),
    documentosObrigatorios: z.string().trim().max(800).nullable().optional(),
    politicaCancelamento: z.string().trim().max(1000).nullable().optional(),
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
        message: "Faixa etaria final deve ser maior ou igual ao inicio",
      });
    }

    if (new Date(value.dataFimInscricao) < new Date(value.dataInicioInscricao)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dataFimInscricao"],
        message: "Fim das inscricoes deve ser posterior ao inicio",
      });
    }
  });
