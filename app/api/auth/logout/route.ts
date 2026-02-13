import { clearAuthCookies } from "@/lib/auth-cookies";
import { apiSuccess } from "@/lib/api-response";

export async function POST() {
  await clearAuthCookies();

  return apiSuccess(null, {
    message: "Logged out",
  });
}


