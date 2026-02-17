import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, THEME_COOKIE_NAME, parseLocale, parseTheme } from "@/lib/user-preferences";

export async function getServerUserPreferences() {
  const cookieStore = await cookies();

  return {
    locale: parseLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value),
    theme: parseTheme(cookieStore.get(THEME_COOKIE_NAME)?.value),
  };
}
