import { UserRole } from "@/lib/auth";

export type OrganizationUserDto = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};
