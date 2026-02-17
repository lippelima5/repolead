import { AppProviders } from "@/components/app-providers";
import { requireServerSession } from "@/lib/session.server";
import { getServerUserPreferences } from "@/lib/user-preferences.server";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireServerSession({ requireAdmin: true, loginRedirectTo: "/admin" });
  const { locale, theme } = await getServerUserPreferences();

  return (
    <AppProviders initialLocale={locale} initialTheme={theme}>
      {children}
    </AppProviders>
  );
}


