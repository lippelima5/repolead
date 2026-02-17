"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "@/content/i18n/en.json";
import pt from "@/content/i18n/pt.json";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  LOCALE_STORAGE_KEY,
  Locale,
  buildPreferenceCookie,
  localeToHtmlLang,
  parseLocale,
} from "@/lib/user-preferences";

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

type I18nProviderProps = {
  children: React.ReactNode;
  initialLocale?: Locale;
};

export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => parseLocale(initialLocale));

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(parseLocale(nextLocale));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.cookie = buildPreferenceCookie(LOCALE_COOKIE_NAME, locale);
    document.documentElement.lang = localeToHtmlLang(locale);
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
    [locale, setLocale],
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
