import { notFound, redirect } from "next/navigation";
import { DEFAULT_DOC_SLUG, isDocsLang } from "@/lib/docs/content";

export default async function DocsLangPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isDocsLang(lang)) {
    notFound();
  }

  redirect(`/docs/${lang}/${DEFAULT_DOC_SLUG}`);
}
