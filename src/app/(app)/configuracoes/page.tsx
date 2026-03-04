import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsEditor } from "@/modules/dashboard/components/settings-editor";

export default async function ConfiguracoesPage() {
  const auth = await getAuthFromCookies();
  if (!auth) {
    redirect("/login");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: auth.organizationId },
    select: { name: true, createdAt: true },
  });

  return (
    <SettingsEditor
      initialUserName={auth.name}
      initialEmail={auth.email}
      initialOrganizationName={organization?.name ?? "Organizacao"}
      createdAt={organization?.createdAt?.toISOString() ?? new Date().toISOString()}
    />
  );
}
