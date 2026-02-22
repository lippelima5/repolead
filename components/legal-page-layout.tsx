import Link from "next/link";
import type { ReactNode } from "react";

type LegalPageLayoutProps = {
  title: string;
  effectiveDate: string;
  children: ReactNode;
};

export function LegalPageLayout({ title, effectiveDate, children }: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Link href="/privacy" className="rounded-md border border-border px-2 py-1 text-muted-foreground hover:text-foreground">
              Privacidade
            </Link>
            <Link href="/terms" className="rounded-md border border-border px-2 py-1 text-muted-foreground hover:text-foreground">
              Termos
            </Link>
            <Link
              href="/acceptable-use"
              className="rounded-md border border-border px-2 py-1 text-muted-foreground hover:text-foreground"
            >
              Uso Aceitavel
            </Link>
          </div>
        </div>

        <article className="rounded-xl border border-border bg-card p-5 sm:p-7">
          <header className="mb-6 border-b border-border pb-4">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Data de vigencia: {effectiveDate}</p>
          </header>

          <div className="space-y-6 text-sm leading-7 text-foreground">{children}</div>
        </article>
      </div>
    </main>
  );
}
