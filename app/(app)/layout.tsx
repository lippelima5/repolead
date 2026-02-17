import { requireServerSession } from "@/lib/session.server";
import { AppProviders } from "@/components/app-providers";
import { getServerUserPreferences } from "@/lib/user-preferences.server";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  await requireServerSession({ loginRedirectTo: "/dashboard" });
  const { locale, theme } = await getServerUserPreferences();

  return (
    <AppProviders initialLocale={locale} initialTheme={theme}>
      {children}
    </AppProviders>
  );
}
