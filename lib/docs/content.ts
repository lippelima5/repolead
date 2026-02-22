import { readFile } from "fs/promises";
import path from "path";

export const DOC_LANGS = ["pt", "en"] as const;
export type DocsLang = (typeof DOC_LANGS)[number];

export type DocsPageMeta = {
  slug: string;
  title: string;
  description: string;
};

type LocalizedDocsPage = {
  slug: string;
  title: Record<DocsLang, string>;
  description: Record<DocsLang, string>;
};

const docsPages: LocalizedDocsPage[] = [
  {
    slug: "getting-started",
    title: {
      pt: "Comecando",
      en: "Getting Started",
    },
    description: {
      pt: "Setup rápido e primeiros passos.",
      en: "Quick setup and first steps.",
    },
  },
  {
    slug: "concepts",
    title: {
      pt: "Conceitos",
      en: "Concepts",
    },
    description: {
      pt: "Modelo de captura, leads e entregas.",
      en: "Capture, leads and delivery model.",
    },
  },
  {
    slug: "exports",
    title: {
      pt: "Exportação de dados",
      en: "Data Exports",
    },
    description: {
      pt: "Como baixar CSV e enviar por email.",
      en: "How to download CSV and send by email.",
    },
  },
  {
    slug: "api",
    title: {
      pt: "API pública",
      en: "Public API",
    },
    description: {
      pt: "Consultar leads em outras plataformas.",
      en: "Read leads from external platforms.",
    },
  },
  {
    slug: "integrations",
    title: {
      pt: "Integrações e exemplos",
      en: "Integrations and examples",
    },
    description: {
      pt: "Exemplos praticos com n8n e backend custom.",
      en: "Practical examples with n8n and custom backends.",
    },
  },
];

export const DEFAULT_DOC_LANG: DocsLang = "pt";
export const DEFAULT_DOC_SLUG = "getting-started";

export function isDocsLang(value: string): value is DocsLang {
  return DOC_LANGS.includes(value as DocsLang);
}

export function getDocsNav(lang: DocsLang): DocsPageMeta[] {
  return docsPages.map((page) => ({
    slug: page.slug,
    title: page.title[lang],
    description: page.description[lang],
  }));
}

export function getDocsPageMeta(lang: DocsLang, slug: string): DocsPageMeta | null {
  const found = docsPages.find((page) => page.slug === slug);
  if (!found) {
    return null;
  }

  return {
    slug: found.slug,
    title: found.title[lang],
    description: found.description[lang],
  };
}

export async function readDocMarkdown(lang: DocsLang, slug: string) {
  const fullPath = path.join(process.cwd(), "content", "docs", lang, `${slug}.md`);
  try {
    return await readFile(fullPath, "utf8");
  } catch {
    return null;
  }
}

export function getOtherDocsLang(lang: DocsLang): DocsLang {
  return lang === "pt" ? "en" : "pt";
}
