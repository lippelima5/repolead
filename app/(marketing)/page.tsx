"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle,
  Clock,
  FileJson,
  Lock,
  Monitor,
  Moon,
  Send,
  Shield,
  Sun,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/i18n-context";
import { useTheme } from "@/contexts/theme-context";

export default function LandingPage() {
  const { locale, setLocale, t } = useI18n();
  const { theme, setTheme } = useTheme();

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">LeadVault</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              {t("marketing.features")}
            </a>
            <a href="#pricing" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              {t("marketing.pricing")}
            </a>
            <a href="#faq" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              {t("marketing.faq")}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
              className="px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {locale === "pt" ? "EN" : "PT"}
            </button>
            <button
              onClick={() => setTheme(nextTheme)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label={t("sidebar.theme")}
            >
              <ThemeIcon className="w-4 h-4" />
            </button>
            <Button variant="ghost" size="sm" className="text-[13px] h-8 hidden sm:inline-flex" asChild>
              <Link href="/login">{t("marketing.login")}</Link>
            </Button>
            <Button size="sm" className="text-[13px] h-8" asChild>
              <Link href="/register">{t("marketing.get_started")}</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="py-16 md:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-medium mb-6">
            <Zap className="w-3 h-3" />
            {t("marketing.pricing_badge")}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">{t("marketing.hero_title")}</h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{t("marketing.hero_subtitle")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Button size="lg" className="gap-2 h-11 px-6 text-[14px] w-full sm:w-auto" asChild>
              <Link href="/register">
                {t("marketing.get_started")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="gap-2 h-11 px-6 text-[14px] w-full sm:w-auto">
              {t("marketing.hero_secondary")}
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-8 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-success" />
              {t("marketing.usp_pipeline")}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-success" />
              {t("marketing.usp_dedupe")}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-success" />
              {t("marketing.usp_dlq")}
            </span>
          </div>
        </div>
      </section>

      <section className="py-20 bg-surface-2" id="features">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{t("marketing.feature_title")}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Shield, title: t("marketing.feature_idempotency_title"), desc: t("marketing.feature_idempotency_desc") },
              { icon: FileJson, title: t("marketing.feature_raw_payload_title"), desc: t("marketing.feature_raw_payload_desc") },
              { icon: Clock, title: t("marketing.feature_timeline_title"), desc: t("marketing.feature_timeline_desc") },
              { icon: Send, title: t("marketing.feature_deliveries_title"), desc: t("marketing.feature_deliveries_desc") },
              { icon: Activity, title: t("marketing.feature_observability_title"), desc: t("marketing.feature_observability_desc") },
              { icon: Lock, title: t("marketing.feature_security_title"), desc: t("marketing.feature_security_desc") },
            ].map((feature) => (
              <div key={feature.title} className="bg-card border border-border rounded-xl p-5">
                <feature.icon className="w-5 h-5 text-primary mb-3" />
                <h3 className="text-[14px] font-semibold text-foreground mb-1.5">{feature.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20" id="pricing">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">{t("marketing.pricing")}</h2>
            <p className="text-primary font-medium text-[13px] mt-2">{t("marketing.pricing_badge")}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-base font-semibold text-foreground">{t("marketing.plan_starter")}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">R$ 97</span>
                <span className="text-[13px] text-muted-foreground">{t("marketing.per_month")}</span>
              </div>
              <Button variant="outline" className="w-full mt-6 h-9 text-[13px]" asChild>
                <Link href="/register">{t("marketing.get_started")}</Link>
              </Button>
            </div>
            <div className="bg-card border-2 border-primary rounded-xl p-6 relative">
              <div className="absolute -top-3 left-6 px-2.5 py-0.5 bg-primary text-primary-foreground text-[11px] font-medium rounded-full">
                {t("marketing.popular")}
              </div>
              <h3 className="text-base font-semibold text-foreground">{t("marketing.plan_pro")}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">R$ 297</span>
                <span className="text-[13px] text-muted-foreground">{t("marketing.per_month")}</span>
              </div>
              <Button className="w-full mt-6 h-9 text-[13px]" asChild>
                <Link href="/register">{t("marketing.get_started")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20" id="faq">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{t("marketing.faq_title")}</h2>
          <div className="space-y-3">
            {[
              { q: t("marketing.faq_q1"), a: t("marketing.faq_a1") },
              { q: t("marketing.faq_q2"), a: t("marketing.faq_a2") },
              { q: t("marketing.faq_q3"), a: t("marketing.faq_a3") },
            ].map((item) => (
              <details key={item.q} className="rounded-lg border border-border bg-card p-4">
                <summary className="cursor-pointer text-sm font-medium">{item.q}</summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-[13px] font-medium text-foreground">LeadVault</span>
          </div>
          <p className="text-[12px] text-muted-foreground">{t("marketing.footer_rights")}</p>
        </div>
      </footer>
    </div>
  );
}
