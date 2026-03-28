export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#edf5ff_100%)] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,122,255,0.10),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(130,215,255,0.18),transparent_30%)]" />
      <div className="absolute left-[8%] top-[12%] h-52 w-52 rounded-full bg-[#007AFF]/10 blur-3xl" />
      <div className="absolute bottom-[10%] right-[10%] h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-[1120px] gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden rounded-[36px] border border-white/70 bg-[linear-gradient(160deg,#101828_0%,#22324c_56%,#2f4b78_100%)] p-9 text-white shadow-[0_28px_80px_rgba(16,24,40,0.22)] xl:flex xl:flex-col xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">EventRun Pro</p>
            <h1 className="mt-6 text-5xl leading-[0.95]">Controle profissional para organizadores de corrida</h1>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-white/72">
              Operação, orçamento, regulamento e proposta comercial no mesmo fluxo, com leitura clara e foco em execução.
            </p>
          </div>

          <div className="grid gap-3">
            <AuthFeature title="Operação em tempo real" description="Checklist, responsáveis e alertas por evento." />
            <AuthFeature title="Financeiro guiado" description="Custos, preço mínimo, margem e cenários de receita." />
            <AuthFeature title="Comercial pronto para vender" description="Pacotes, proposta e PDF em um único produto." />
          </div>
        </section>

        <section className="relative rounded-[36px] border border-white/70 bg-white/92 p-8 shadow-[0_24px_70px_rgba(16,24,40,0.10)] backdrop-blur xl:p-10">
          {children}
        </section>
      </div>
    </div>
  );
}

function AuthFeature({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-white/68">{description}</p>
    </div>
  );
}
