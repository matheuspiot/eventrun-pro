import { z } from "zod";

export const regulationConfigSchema = z.object({
  eventId: z.string().min(1, "Evento e obrigatorio"),
  possuiKids: z.boolean(),
  possuiChip: z.boolean(),
  possuiPremiacaoDinheiro: z.boolean(),
  logoDataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/, "Logo invalida")
    .max(1_500_000, "Logo muito grande")
    .nullable()
    .optional(),
  tempoLimiteMinutos: z.coerce.number().int().positive(),
  plataformaInscricao: z.array(z.string().min(1)).min(1),
  valorInscricao: z.coerce.number().nonnegative(),
  limiteVagas: z.coerce.number().int().positive(),
  emailContato: z.string().email(),
  whatsappContato: z.string().min(8),
  dataInicioInscricao: z.string().min(1),
  dataFimInscricao: z.string().min(1),
});
