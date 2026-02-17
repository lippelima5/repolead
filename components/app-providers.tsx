"use client";

import React from "react";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { I18nProvider } from "@/contexts/i18n-context";
import { Locale, ThemeMode } from "@/lib/user-preferences";

type AppProvidersProps = {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialTheme?: ThemeMode;
};

export function AppProviders({ children, initialLocale, initialTheme }: AppProvidersProps) {
  return (
    <AuthProvider>
      <ThemeProvider initialTheme={initialTheme}>
        <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
