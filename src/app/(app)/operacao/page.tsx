import { OperationsPlanner } from "@/modules/operations/components/operations-planner";
import { requireModuleAccess } from "@/lib/access";

export default async function OperacaoPage() {
  await requireModuleAccess("operacao");

  return <OperationsPlanner />;
}
