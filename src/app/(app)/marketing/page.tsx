import { marketingModule } from "@/modules/marketing";

export default function MarketingPage() {
  return (
    <section className="rounded-3xl border border-border bg-surface p-8 shadow-sm">
      <h2 className="text-3xl font-heading text-zinc-900">{marketingModule.title}</h2>
      <p className="mt-2 text-zinc-600">{marketingModule.description}</p>
    </section>
  );
}
