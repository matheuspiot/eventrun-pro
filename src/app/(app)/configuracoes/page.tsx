import { requireModuleAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { SettingsEditor } from "@/modules/dashboard/components/settings-editor";

export default async function ConfiguracoesPage() {
  const auth = await requireModuleAccess("configuracoes");

  const [organization, users] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: { name: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { organizationId: auth.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <SettingsEditor
      initialUserName={auth.name}
      initialEmail={auth.email}
      initialUserRole={auth.role}
      initialOrganizationName={organization?.name ?? "Organizacao"}
      createdAt={organization?.createdAt?.toISOString() ?? new Date().toISOString()}
      initialUsers={users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
      }))}
    />
  );
}
