import { redirect } from "next/navigation";
import { getAuthFromCookies } from "@/lib/auth";

export default async function HomePage() {
  const auth = await getAuthFromCookies();

  if (auth) {
    redirect("/dashboard");
  }

  redirect("/login");
}
