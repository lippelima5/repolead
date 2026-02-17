export type Locale = "pt" | "en";
export type ThemeMode = "light" | "dark" | "system";

export const LOCALE_STORAGE_KEY = "repolead.locale";
export const THEME_STORAGE_KEY = "repolead.theme";

export const LOCALE_COOKIE_NAME = "repolead.locale";
export const THEME_COOKIE_NAME = "repolead.theme";

export const DEFAULT_LOCALE: Locale = "pt";
export const DEFAULT_THEME: ThemeMode = "system";

const PREFERENCE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function parseLocale(value: string | null | undefined): Locale {
  return value === "pt" || value === "en" ? value : DEFAULT_LOCALE;
}

export function parseTheme(value: string | null | undefined): ThemeMode {
  return value === "light" || value === "dark" || value === "system" ? value : DEFAULT_THEME;
}

export function localeToHtmlLang(locale: Locale) {
  return locale === "pt" ? "pt-BR" : "en-US";
}

export function resolveTheme(theme: ThemeMode, prefersDark: boolean) {
  if (theme === "system") {
    return prefersDark ? "dark" : "light";
  }

  return theme;
}

export function buildPreferenceCookie(name: string, value: string) {
  return `${name}=${encodeURIComponent(value)}; path=/; max-age=${PREFERENCE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}
