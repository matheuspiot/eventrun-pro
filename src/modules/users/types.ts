import { UserRole } from "@/lib/auth";

export type OrganizationUserDto = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: UserRole;
  createdAt: string;
};
