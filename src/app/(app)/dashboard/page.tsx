import { EventsManager } from "@/modules/events/components/events-manager";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Painel principal</p>
        <h2 className="mt-2 text-4xl font-heading text-zinc-900">Projetos de corrida</h2>
      </div>
      <EventsManager />
    </section>
  );
}
