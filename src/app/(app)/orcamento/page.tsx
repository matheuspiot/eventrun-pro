import { CostLibrary } from "@/modules/budget/components/cost-library";
import { EventBudgetPlanner } from "@/modules/budget/components/event-budget-planner";

export default function OrcamentoPage() {
  return (
    <div className="space-y-6">
      <EventBudgetPlanner />
      <CostLibrary />
    </div>
  );
}
