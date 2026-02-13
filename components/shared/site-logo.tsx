import Link from "next/link";
import { siteConfig } from "@/content/site";

type SiteLogoProps = {
  href?: string;
  className?: string;
};

export function SiteLogo({ href, className }: SiteLogoProps) {
  return (
    <Link href={href || siteConfig.links.home} className={className || "text-lg font-bold tracking-tight text-foreground"}>
      {siteConfig.name}
      <span className="text-muted-foreground">.</span>
    </Link>
  );
}

