"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type Locale = "pt" | "en";
type ThemeMode = "light" | "dark" | "system";

const copy = {
  pt: {
    navFeatures: "Funcionalidades",
    navPricing: "Pricing",
    navFaq: "FAQ",
    login: "Entrar",
    cta: "Comecar agora",
    heroTitle: "O repositorio canonico para seus leads",
    heroSubtitle:
      "Ingira de qualquer fonte, normalize, dedupe e distribua com rastreabilidade total. Um endpoint, zero leads perdidos.",
    heroSecondary: "Ver como funciona",
    featureTitle: "Tudo que voce precisa",
    pricingTitle: "Early Access - 50% off",
    faqTitle: "Perguntas frequentes",
  },
  en: {
    navFeatures: "Features",
    navPricing: "Pricing",
    navFaq: "FAQ",
    login: "Login",
    cta: "Get started",
    heroTitle: "The canonical repository for your leads",
    heroSubtitle:
      "Ingest from any source, normalize, dedupe and deliver with full traceability. One endpoint, zero lost leads.",
    heroSecondary: "See how it works",
    featureTitle: "Everything you need",
    pricingTitle: "Early Access - 50% off",
    faqTitle: "Frequently asked questions",
  },
} as const;

export default function LandingPage() {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "pt";
    const stored = window.localStorage.getItem("leadvault.locale");
    return stored === "pt" || stored === "en" ? stored : "pt";
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const stored = window.localStorage.getItem("leadvault.theme");
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  });

  useEffect(() => {
    const resolved = theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(resolved);
    window.localStorage.setItem("leadvault.theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("leadvault.locale", locale);
  }, [locale]);

  const themeIcon = useMemo(() => {
    if (theme === "light") return Sun;
    if (theme === "dark") return Moon;
    return Monitor;
  }, [theme]);
  const ThemeIcon = themeIcon;

  const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const text = copy[locale];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground">LeadVault</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              {text.navFeatures}
            </a>
            <a href="#pricing" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              {text.navPricing}
            </a>
            <a href="#faq" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              {text.navFaq}
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
            >
              <ThemeIcon className="w-4 h-4" />
            </button>
            <Button variant="ghost" size="sm" className="text-[13px] h-8" asChild>
              <Link href="/login">{text.login}</Link>
            </Button>
            <Button size="sm" className="text-[13px] h-8" asChild>
              <Link href="/register">{text.cta}</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-medium mb-6">
            <Zap className="w-3 h-3" />
            {text.pricingTitle}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">{text.heroTitle}</h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{text.heroSubtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Button size="lg" className="gap-2 h-11 px-6 text-[14px]" asChild>
              <Link href="/register">
                {text.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="gap-2 h-11 px-6 text-[14px]">
              {text.heroSecondary}
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-8 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-success" />
              Pipeline confiavel com replay
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-success" />
              Dedupe automatico
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-success" />
              Fan-out com DLQ
            </span>
          </div>
        </div>
      </section>

      <section className="py-24 bg-surface-2" id="features">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-16">{text.featureTitle}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Shield, title: "Idempotency", desc: "Resends never create duplicates." },
              { icon: FileJson, title: "Raw payload", desc: "Every ingestion keeps the original payload." },
              { icon: Clock, title: "Timeline", desc: "Append-only audit trail for each lead." },
              { icon: Send, title: "Deliveries", desc: "Retries with exponential backoff and DLQ." },
              { icon: Activity, title: "Observability", desc: "KPIs, failures and source activity in one place." },
              { icon: Lock, title: "Security", desc: "Workspace isolation and signed deliveries." },
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

      <section className="py-24" id="pricing">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">Pricing</h2>
            <p className="text-primary font-medium text-[13px] mt-2">{text.pricingTitle}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-base font-semibold text-foreground">Starter</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">R$ 97</span>
                <span className="text-[13px] text-muted-foreground">/mes</span>
              </div>
              <Button variant="outline" className="w-full mt-6 h-9 text-[13px]" asChild>
                <Link href="/register">{text.cta}</Link>
              </Button>
            </div>
            <div className="bg-card border-2 border-primary rounded-xl p-6 relative">
              <div className="absolute -top-3 left-6 px-2.5 py-0.5 bg-primary text-primary-foreground text-[11px] font-medium rounded-full">Popular</div>
              <h3 className="text-base font-semibold text-foreground">Pro</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">R$ 297</span>
                <span className="text-[13px] text-muted-foreground">/mes</span>
              </div>
              <Button className="w-full mt-6 h-9 text-[13px]" asChild>
                <Link href="/register">{text.cta}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24" id="faq">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{text.faqTitle}</h2>
          <div className="space-y-3">
            {[
              {
                q: "How does idempotency work?",
                a: "Sending the same Idempotency-Key for the same source returns the original ingestion id.",
              },
              { q: "How does replay work?", a: "You can replay one or many failed deliveries and the system retries them immediately." },
              { q: "Is there rate limiting?", a: "Each source has a configurable requests-per-minute limit with HTTP 429 on overflow." },
            ].map((item) => (
              <details key={item.q} className="rounded-lg border border-border bg-card p-4">
                <summary className="cursor-pointer text-sm font-medium">{item.q}</summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-[13px] font-medium text-foreground">LeadVault</span>
          </div>
          <p className="text-[12px] text-muted-foreground">© 2026 LeadVault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
