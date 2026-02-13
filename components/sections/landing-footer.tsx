import Link from "next/link";
import { siteConfig } from "@/content/site";
import { SiteLogo } from "@/components/shared/site-logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <SiteLogo />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{siteConfig.description}</p>
          </div>

          {siteConfig.footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{column.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">{`(c) ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.`}</p>
          <div className="flex gap-6">
            <Link href={siteConfig.links.blog} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Blog
            </Link>
            <Link href={siteConfig.links.changelog} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Changelog
            </Link>
            <Link href={siteConfig.links.dashboard} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

