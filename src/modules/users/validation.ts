import { z } from "zod";
import { usernamePattern } from "@/lib/username";

export const createOrganizationUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do usuário."),
  username: z.string().trim().regex(usernamePattern, "Informe um usuário válido."),
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  role: z.enum(["ADMIN", "FINANCEIRO", "OPERACIONAL", "MARKETING"]),
});

export const updateOrganizationUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  username: z.string().trim().regex(usernamePattern, "Informe um usuário válido.").optional(),
  role: z.enum(["ADMIN", "FINANCEIRO", "OPERACIONAL", "MARKETING"]).optional(),
});

export type CreateOrganizationUserInput = z.infer<typeof createOrganizationUserSchema>;
export type UpdateOrganizationUserInput = z.infer<typeof updateOrganizationUserSchema>;
