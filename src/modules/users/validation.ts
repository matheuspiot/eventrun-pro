import { z } from "zod";

export const createOrganizationUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do usuario."),
  email: z.string().trim().email("Informe um e-mail valido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  role: z.enum(["ADMIN", "FINANCEIRO", "OPERACIONAL", "MARKETING"]),
});

export const updateOrganizationUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  role: z.enum(["ADMIN", "FINANCEIRO", "OPERACIONAL", "MARKETING"]).optional(),
});

export type CreateOrganizationUserInput = z.infer<typeof createOrganizationUserSchema>;
export type UpdateOrganizationUserInput = z.infer<typeof updateOrganizationUserSchema>;
