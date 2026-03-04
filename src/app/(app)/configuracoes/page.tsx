import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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
    <section className="space-y-6">
      <header className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Configurações
        </p>
        <h2 className="mt-2 text-3xl font-heading text-zinc-900">Preferências da organização</h2>
        <p className="mt-2 text-zinc-600">
          Página base para dados da conta, parâmetros operacionais e padrões financeiros.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-xl font-heading text-zinc-900">Conta</h3>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-zinc-500">Usuário</dt>
              <dd className="font-medium text-zinc-900">{auth.name}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">E-mail</dt>
              <dd className="font-medium text-zinc-900">{auth.email}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Organização</dt>
              <dd className="font-medium text-zinc-900">{organization?.name ?? "Não informada"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Criada em</dt>
              <dd className="font-medium text-zinc-900">
                {organization?.createdAt
                  ? new Date(organization.createdAt).toLocaleDateString("pt-BR")
                  : "-"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-xl font-heading text-zinc-900">Padrão financeiro</h3>
          <ul className="mt-4 space-y-2 text-sm text-zinc-700">
            <li>Moeda base: BRL</li>
            <li>Formato de data: dd/mm/aaaa</li>
            <li>Exibição de custos: com duas casas decimais</li>
            <li>Indicadores de orçamento: por evento selecionado</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-xl font-heading text-zinc-900">Checklist inicial</h3>
          <ul className="mt-4 space-y-2 text-sm text-zinc-700">
            <li>Confirmar dados fiscais da organização</li>
            <li>Definir taxa da plataforma padrão</li>
            <li>Definir percentual médio de cancelamento/reembolso</li>
            <li>Validar e-mails e WhatsApp de suporte</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
