import { RegulationBuilder } from "@/modules/regulation/components/regulation-builder";
import { requireModuleAccess } from "@/lib/access";

export default async function RegulamentoPage() {
  await requireModuleAccess("regulamento");

  return <RegulationBuilder />;
}
