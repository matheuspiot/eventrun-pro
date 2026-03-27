import { CostLibrary } from "@/modules/budget/components/cost-library";
import { EventBudgetPlanner } from "@/modules/budget/components/event-budget-planner";
import { requireModuleAccess } from "@/lib/access";

export default async function OrcamentoPage() {
  await requireModuleAccess("orcamento");

  return (
    <div className="space-y-6">
      <EventBudgetPlanner />
      <CostLibrary />
    </div>
  );
}
