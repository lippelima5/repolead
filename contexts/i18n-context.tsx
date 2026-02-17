"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Locale = "pt" | "en";
type Dictionary = Record<string, { pt: string; en: string }>;

const dictionary: Dictionary = {
  "nav.dashboard": { pt: "Dashboard", en: "Dashboard" },
  "nav.integrations": { pt: "Integracoes", en: "Integrations" },
  "nav.sources": { pt: "Sources", en: "Sources" },
  "nav.destinations": { pt: "Destinos", en: "Destinations" },
  "nav.leads": { pt: "Leads", en: "Leads" },
  "nav.ingestions": { pt: "Ingestoes", en: "Ingestions" },
  "nav.deliveries": { pt: "Entregas", en: "Deliveries" },
  "nav.alerts": { pt: "Alertas", en: "Alerts" },
  "nav.settings": { pt: "Settings", en: "Settings" },
  "common.search": { pt: "Buscar...", en: "Search..." },
  "common.save": { pt: "Salvar", en: "Save" },
  "common.cancel": { pt: "Cancelar", en: "Cancel" },
  "common.create": { pt: "Criar", en: "Create" },
  "common.replay": { pt: "Replay", en: "Replay" },
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return "pt";
    }

    const stored = window.localStorage.getItem("leadvault.locale");
    return stored === "pt" || stored === "en" ? stored : "pt";
  });

  useEffect(() => {
    window.localStorage.setItem("leadvault.locale", locale);
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => dictionary[key]?.[locale] || key,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return value;
}
