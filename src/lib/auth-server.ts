import { cookies } from "next/headers";
import { TOKEN_COOKIE, verifyAuthToken } from "./auth";

export async function getAuthFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  return verifyAuthToken(token);
}
