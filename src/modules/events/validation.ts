import { z } from "zod";

export const eventFormSchema = z.object({
  nomeEvento: z.string().min(3, "Nome do evento deve ter ao menos 3 caracteres"),
  dataEvento: z.string().min(1, "Data do evento e obrigatoria"),
  cidade: z.string().min(2, "Cidade e obrigatoria"),
  estado: z.string().min(2, "Estado e obrigatorio"),
  localLargada: z.string().min(3, "Local de largada e obrigatorio"),
  organizador: z.string().min(3, "Organizador e obrigatorio"),
  cnpjOrganizador: z.string().min(14, "CNPJ invalido"),
  status: z.enum(["PLANEJAMENTO", "EM_ANDAMENTO", "FINALIZADO"]).default("PLANEJAMENTO"),
});

export type EventFormInput = z.infer<typeof eventFormSchema>;

