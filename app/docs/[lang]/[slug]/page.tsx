import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  DOC_LANGS,
  getDocsNav,
  getDocsPageMeta,
  getOtherDocsLang,
  isDocsLang,
  readDocMarkdown,
} from "@/lib/docs/content";

export async function generateStaticParams() {
  return DOC_LANGS.flatMap((lang) =>
    getDocsNav(lang).map((page) => ({
      lang,
      slug: page.slug,
    })),
  );
}

export default async function DocsArticlePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isDocsLang(lang)) {
    notFound();
  }

  const pageMeta = getDocsPageMeta(lang, slug);
  if (!pageMeta) {
    notFound();
  }

  const markdown = await readDocMarkdown(lang, slug);
  if (!markdown) {
    notFound();
  }

  const navItems = getDocsNav(lang);
  const otherLang = getOtherDocsLang(lang);
  const otherPageMeta = getDocsPageMeta(otherLang, slug);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-foreground">
            RepoLead Docs
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link
              href={`/docs/${otherLang}/${otherPageMeta?.slug || "getting-started"}`}
              className="text-[12px] rounded-md border border-border px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {otherLang.toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6">
        <aside className="lg:sticky lg:top-20 self-start bg-card border border-border rounded-xl p-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
            {lang === "pt" ? "Documentação" : "Documentation"}
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = item.slug === slug;
              return (
                <Link
                  key={item.slug}
                  href={`/docs/${lang}/${item.slug}`}
                  className={`block rounded-lg px-2.5 py-2 transition-colors ${
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  }`}
                >
                  <p className="text-[13px] font-medium">{item.title}</p>
                  <p className="text-[11px] mt-0.5">{item.description}</p>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="bg-card border border-border rounded-xl p-5 md:p-7">
          <article className="docs-markdown max-w-none text-[14px] text-muted-foreground leading-relaxed space-y-3 [&_h1]:text-foreground [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_a]:text-primary [&_a]:underline [&_code]:bg-surface-2 [&_code]:rounded [&_code]:border [&_code]:border-border [&_code]:px-1.5 [&_code]:py-0.5 [&_pre]:bg-surface-2 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:p-3 [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1.5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </article>
        </main>
      </div>
    </div>
  );
}
