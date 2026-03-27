import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { getAuthFromCookies } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthFromCookies();

  if (!auth) {
    redirect("/login");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: auth.organizationId },
    select: { name: true },
  });

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        organizationName={organization?.name ?? "Organizacao"}
        userName={auth.name}
        userRole={auth.role}
      />
      <main className="ml-0 min-h-screen p-6 md:ml-72 md:p-10">{children}</main>
    </div>
  );
}
