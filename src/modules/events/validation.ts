import { z } from "zod";

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function isValidCnpj(value: string) {
  const digits = normalizeDigits(value);

  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const calcCheckDigit = (base: string, factors: number[]) => {
    const total = base
      .split("")
      .reduce((sum, digit, index) => sum + Number(digit) * factors[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcCheckDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calcCheckDigit(
    `${digits.slice(0, 12)}${firstDigit}`,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return digits === `${digits.slice(0, 12)}${firstDigit}${secondDigit}`;
}

export const eventFormSchema = z.object({
  nomeEvento: z.string().min(3, "Nome do evento deve ter ao menos 3 caracteres"),
  dataEvento: z.string().min(1, "Data do evento e obrigatoria"),
  cidade: z.string().min(2, "Cidade e obrigatoria"),
  estado: z.string().min(2, "Estado é obrigatório"),
  localLargada: z.string().min(3, "Local de largada é obrigatório"),
  organizador: z.string().min(3, "Organizador é obrigatório"),
  cnpjOrganizador: z
    .string()
    .transform((value) => normalizeDigits(value))
    .refine(isValidCnpj, "CNPJ inválido"),
  modalidades: z.string().trim().max(300).nullable().optional(),
  distancias: z.string().trim().max(300).nullable().optional(),
  capacidadeMaxima: z.coerce.number().int().positive().nullable().optional(),
  limiteTecnico: z.string().trim().max(500).nullable().optional(),
  cronogramaResumo: z.string().trim().max(1200).nullable().optional(),
  patrocinadores: z.string().trim().max(500).nullable().optional(),
  fornecedores: z.string().trim().max(500).nullable().optional(),
  status: z.enum(["PLANEJAMENTO", "EM_ANDAMENTO", "FINALIZADO"]).default("PLANEJAMENTO"),
});

export type EventFormInput = z.infer<typeof eventFormSchema>;
