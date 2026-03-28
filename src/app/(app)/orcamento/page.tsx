import { BudgetWorkspace } from "@/modules/budget/components/budget-workspace";
import { requireModuleAccess } from "@/lib/access";

export default async function OrcamentoPage() {
  await requireModuleAccess("orcamento");

  return <BudgetWorkspace />;
}
