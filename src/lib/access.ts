import { redirect } from "next/navigation";
import { AppModule, canAccessModule, getModuleLabel } from "./auth";
import { getAuthFromCookies } from "./auth-server";

export async function requireModuleAccess(module: AppModule) {
  const auth = await getAuthFromCookies();

  if (!auth) {
    redirect("/login");
  }

  if (!canAccessModule(auth.role, module)) {
    redirect(`/dashboard?forbidden=${encodeURIComponent(getModuleLabel(module))}`);
  }

  return auth;
}
