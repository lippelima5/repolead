import { AppProviders } from "@/components/app-providers";
import { getServerUserPreferences } from "@/lib/user-preferences.server";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { locale, theme } = await getServerUserPreferences();

  return (
    <AppProviders initialLocale={locale} initialTheme={theme}>
      {children}
    </AppProviders>
  );
}
