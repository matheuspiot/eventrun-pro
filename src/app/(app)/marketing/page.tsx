import { requireModuleAccess } from "@/lib/access";
import MarketingPageClient from "./page-client";

export default async function MarketingPage() {
  await requireModuleAccess("marketing");

  return <MarketingPageClient />;
}
