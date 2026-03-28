"use client";

import { useState } from "react";
import { UiIcon } from "@/components/ui-icon";
import { CostLibrary } from "@/modules/budget/components/cost-library";
import { EventBudgetPlanner } from "@/modules/budget/components/event-budget-planner";

export function BudgetWorkspace() {
  const [showLibrary, setShowLibrary] = useState(false);

  return (
    <div className="space-y-6">
      <EventBudgetPlanner />

      <section className="rounded-[32px] border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              <UiIcon name="library" className="h-4 w-4" />
              Base financeira
            </div>
            <h3 className="mt-2 text-2xl text-zinc-900">Biblioteca de custos</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Abra somente quando precisar cadastrar ou revisar custos padrão.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLibrary((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-surface-muted"
          >
            <UiIcon name="library" className="h-4 w-4 text-accent" />
            {showLibrary ? "Fechar biblioteca" : "Abrir biblioteca"}
          </button>
        </div>

        {showLibrary ? <div className="mt-5"><CostLibrary /></div> : null}
      </section>
    </div>
  );
}
