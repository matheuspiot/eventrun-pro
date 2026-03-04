const canais = [
  { nome: "Instagram Ads", objetivo: "Captação de inscritos", status: "Planejado" },
  { nome: "Assessorias de corrida", objetivo: "Parcerias e lotes", status: "Em andamento" },
  { nome: "Influenciadores locais", objetivo: "Alcance regional", status: "Planejado" },
  { nome: "E-mail base antiga", objetivo: "Reativação", status: "Concluído" },
];

const cronograma = [
  "T-90 dias: abrir lista de interesse e landing page",
  "T-60 dias: iniciar mídia paga e orgânico intensivo",
  "T-30 dias: reforço de prova social e urgência de virada de lote",
  "T-7 dias: comunicação logística e checklist final para inscritos",
];

export default function MarketingPage() {
  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Marketing
        </p>
        <h2 className="mt-2 text-3xl font-heading text-zinc-900">Plano de divulgação do evento</h2>
        <p className="mt-2 text-zinc-600">
          Painel inicial para organizar canais, cronograma e metas de aquisição de atletas.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-xl font-heading text-zinc-900">Meta de inscrições</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Use este bloco como referência rápida para alinhamento do time comercial.
          </p>
          <div className="mt-4 rounded-2xl bg-surface-muted p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Meta sugerida</p>
            <p className="mt-1 text-3xl font-heading text-zinc-900">1.000 inscritos</p>
          </div>
        </article>

        <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm xl:col-span-2">
          <h3 className="text-xl font-heading text-zinc-900">Cronograma recomendado</h3>
          <ol className="mt-4 space-y-3">
            {cronograma.map((item) => (
              <li key={item} className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-zinc-700">
                {item}
              </li>
            ))}
          </ol>
        </article>
      </div>

      <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="text-xl font-heading text-zinc-900">Canais de aquisição</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-zinc-500">
                <th className="px-3 py-2">Canal</th>
                <th className="px-3 py-2">Objetivo</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {canais.map((canal) => (
                <tr key={canal.nome} className="border-b border-border/80">
                  <td className="px-3 py-3 font-medium text-zinc-900">{canal.nome}</td>
                  <td className="px-3 py-3 text-zinc-600">{canal.objetivo}</td>
                  <td className="px-3 py-3 text-zinc-600">{canal.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
