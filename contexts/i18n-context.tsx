"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "@/content/i18n/en.json";
import pt from "@/content/i18n/pt.json";

type Locale = "pt" | "en";
type TranslationParams = Record<string, string | number>;
type DictionaryNode = string | { [key: string]: DictionaryNode };

const dictionaries: Record<Locale, DictionaryNode> = { pt, en };

function getPathValue(dictionary: DictionaryNode, key: string): string | null {
  const result = key.split(".").reduce<DictionaryNode | undefined>((acc, part) => {
    if (!acc || typeof acc === "string") {
      return undefined;
    }
    return acc[part];
  }, dictionary);

  return typeof result === "string" ? result : null;
}

function interpolate(template: string, params?: TranslationParams) {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (fullMatch, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? fullMatch : String(value);
  });
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslationParams) => string;
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
    document.documentElement.lang = locale === "pt" ? "pt-BR" : "en-US";
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => {
        const localized = getPathValue(dictionaries[locale], key);
        const fallback = getPathValue(dictionaries.en, key);
        return interpolate(localized || fallback || key, params);
      },
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
