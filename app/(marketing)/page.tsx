'use client';

import Image from "next/image";
import Link from "next/link";
import { Zap, ArrowRight, CheckCircle, Shield, RefreshCw, Activity, FileJson, Clock, Send, Lock, Globe, Sun, Moon, Monitor, ChevronDown, AlertTriangle, Database, GitMerge, Eye, Users, Code, ExternalLink, Check, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useI18n } from "@/contexts/i18n-context";
import { useTheme } from "@/contexts/theme-context";

type ThemeMode = "light" | "dark" | "system";
type TranslationParams = Record<string, string | number>;
type TranslationFn = (key: string, params?: TranslationParams) => string;

const THEME_ICONS: Record<ThemeMode, LucideIcon> = { light: Sun, dark: Moon, system: Monitor };
const NEXT_THEME: Record<ThemeMode, ThemeMode> = { light: "dark", dark: "system", system: "light" };

export default function Landing() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();

  const ThemeIcon = THEME_ICONS[theme];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <Image src="/logo.png" alt="RepoLead" width={28} height={28} className="w-7 h-7 rounded-lg object-contain" priority />
            </div>
            <span className="font-semibold text-sm text-foreground">RepoLead</span>
          </div>
          <nav className="hidden lg:flex items-center gap-5">
            <a href="#product" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">{t("lp.nav.product")}</a>
            <a href="#how" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">{t("lp.nav.how")}</a>
            <a href="#usecases" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">{t("lp.nav.usecases")}</a>
            <a href="#security" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">{t("lp.nav.security")}</a>
            <a href="#faq" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">{t("lp.nav.faq")}</a>
            <Link href="/docs" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">{t("lp.nav.docs")}</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setLocale(locale === "pt" ? "en" : "pt")} className="px-2 py-1 rounded-md text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              {locale === "pt" ? "EN" : "PT"}
            </button>
            <button type="button" onClick={() => setTheme(NEXT_THEME[theme])} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <ThemeIcon className="w-4 h-4" />
            </button>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-[13px] h-8 hidden sm:inline-flex" >
                {t("lp.nav.login")}
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="text-[13px] h-8">
                {t("lp.nav.cta")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-medium mb-6">
            <Zap className="w-3 h-3" />
            {t("lp.hero.badge")}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]">
            {t("lp.hero.title")}
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("lp.hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 h-11 px-6 text-[14px]" >
                {t("lp.hero.cta")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline" size="lg" className="gap-2 h-11 px-6 text-[14px]">
                {t("lp.hero.cta2")}
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-8 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-success" />{t("lp.hero.bullet1")}</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-success" />{t("lp.hero.bullet2")}</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-success" />{t("lp.hero.bullet3")}</span>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 bg-surface-2" id="product">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">{t("lp.problem.title")}</h2>
          <p className="text-center text-muted-foreground mb-10 text-[15px]">{t("lp.problem.intro")}</p>
          <div className="grid gap-3">
            {(["pain1", "pain2", "pain3", "pain4", "pain5", "pain6"] as const).map((k) => (
              <div key={k} className="flex items-start gap-3 bg-card border border-border rounded-lg p-4">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                <p className="text-[13px] text-foreground leading-relaxed">{t(`lp.problem.${k}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is RepoLead */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{t("lp.whatis.title")}</h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">{t("lp.whatis.p1")}</p>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-10">{t("lp.whatis.p2")}</p>
          <div className="grid md:grid-cols-3 gap-4">
            {([1, 2, 3] as const).map((i) => (
              <div key={i} className="bg-surface-2 border border-border rounded-xl p-5">
                <h3 className="text-[14px] font-semibold text-foreground mb-2">{t(`lp.whatis.term${i}.title`)}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{t(`lp.whatis.term${i}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-surface-2" id="how">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-16">{t("lp.how.title")}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {([1, 2, 3, 4] as const).map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <span className="text-[11px] font-mono text-primary font-semibold">{t(`lp.how.step${i}.num`)}</span>
                <h3 className="text-[15px] font-semibold text-foreground mt-2 mb-2">{t(`lp.how.step${i}.title`)}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{t(`lp.how.step${i}.desc`)}</p>
              </div>
            ))}
          </div>

          {/* Flow diagram */}
          <div className="mt-12 bg-card border border-border rounded-xl p-6 overflow-x-auto">
            <div className="flex items-center justify-between gap-3 min-w-[600px]">
              <DiagramBlock icon={Globe} label={t("lp.diagram.sources")} sub={t("lp.diagram.api")} />
              <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
              <DiagramBlock icon={Database} label={t("lp.diagram.ingest")} sub="POST /v1/leads/ingest" accent />
              <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
              <DiagramBlock icon={GitMerge} label={t("lp.diagram.process")} sub={t("lp.diagram.process")} />
              <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
              <DiagramBlock icon={Send} label={t("lp.diagram.deliver")} sub={t("lp.diagram.dest")} />
            </div>
          </div>

          {/* Payload + Timeline examples */}
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-[12px] font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{t("lp.payload.title")}</p>
              <pre className="text-[12px] font-mono text-foreground bg-surface-2 rounded-lg p-4 overflow-x-auto leading-relaxed">{`POST /v1/leads/ingest
X-Idempotency-Key: form-abc-123
X-Source-Key: sk_live_...

{
  "email": "maria@empresa.com",
  "phone": "+5511999990000",
  "name": "Maria Silva",
  "tags": ["webinar-jan"],
  "metadata": {
    "utm_source": "google",
    "landing_page": "/webinar"
  }
}`}</pre>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-[12px] font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{t("lp.timeline.title")}</p>
              <div className="space-y-3">
                <TimelineEntry time="14:32:01" label={t("lp.micro.event_received")} status="success" detail="source: website-form" />
                <TimelineEntry time="14:32:02" label={t("lp.micro.merged")} status="info" detail="lead_id: ld_8f3k → ld_2a1m" />
                <TimelineEntry time="14:32:03" label={t("lp.micro.delivered")} status="success" detail="dest: hubspot-webhook" />
                <TimelineEntry time="14:32:03" label={t("lp.micro.delivery_failed")} status="error" detail="dest: slack-notify → 503" />
                <TimelineEntry time="14:32:08" label={t("lp.micro.in_retry")} status="warning" detail="attempt 2/5" />
                <TimelineEntry time="14:33:12" label={t("lp.micro.delivered")} status="success" detail="dest: slack-notify → 200" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20" id="usecases">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{t("lp.usecases.title")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {([
              { icon: Activity, k: "1" as const },
              { icon: RefreshCw, k: "2" as const },
              { icon: Code, k: "3" as const },
              { icon: Eye, k: "4" as const },
            ]).map(({ icon: Icon, k }) => (
              <div key={k} className="bg-card border border-border rounded-xl p-6">
                <Icon className="w-5 h-5 text-primary mb-3" />
                <h3 className="text-[15px] font-semibold text-foreground mb-2">{t(`lp.usecase${k}.title`)}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{t(`lp.usecase${k}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform preview */}
      <section className="py-20 bg-surface-2">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{t("lp.preview.title")}</h2>
          <PreviewTabs t={t} />
        </div>
      </section>

      {/* Beta */}
      <section className="py-20" id="beta">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{t("lp.beta.title")}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-[15px] font-semibold text-foreground mb-4 flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                {t("lp.beta.included_title")}
              </h3>
              <ul className="space-y-2.5">
                {(["inc1", "inc2", "inc3", "inc4", "inc5", "inc6", "inc7"] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2 text-[13px] text-foreground">
                    <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    {t(`lp.beta.${k}`)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-[15px] font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {t("lp.beta.soon_title")}
              </h3>
              <ul className="space-y-2.5 mb-8">
                {(["soon1", "soon2", "soon3", "soon4"] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                    <Clock className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                    {t(`lp.beta.${k}`)}
                  </li>
                ))}
              </ul>
              <div className="border-t border-border pt-5">
                <h4 className="text-[13px] font-semibold text-foreground mb-2">{t("lp.beta.for_title")}</h4>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">{t("lp.beta.for_desc")}</p>
                <h4 className="text-[13px] font-semibold text-foreground mb-2">{t("lp.beta.not_title")}</h4>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{t("lp.beta.not_desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 bg-surface-2" id="security">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">{t("lp.security.title")}</h2>
          <p className="text-center text-muted-foreground mb-12 text-[15px]">{t("lp.security.intro")}</p>
          <div className="grid md:grid-cols-2 gap-4">
            {([
              { icon: Lock, k: "1" as const },
              { icon: Shield, k: "2" as const },
              { icon: Users, k: "3" as const },
              { icon: FileJson, k: "4" as const },
            ]).map(({ icon: Icon, k }) => (
              <div key={k} className="bg-card border border-border rounded-xl p-5">
                <Icon className="w-5 h-5 text-primary mb-3" />
                <h3 className="text-[14px] font-semibold text-foreground mb-1.5">{t(`lp.security.s${k}.title`)}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{t(`lp.security.s${k}.desc`)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-card border border-border rounded-xl p-5">
            <p className="text-[13px] text-muted-foreground leading-relaxed">{t("lp.security.lgpd")}</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20" id="faq">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{t("lp.faq.title")}</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((i) => (
              <FAQItem key={i} question={t(`lp.faq.q${i}`)} answer={t(`lp.faq.a${i}`)} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-surface-2">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">{t("lp.final.title")}</h2>
          <p className="text-muted-foreground mt-3 text-[15px]">{t("lp.final.subtitle")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 h-11 px-6 text-[14px]">
                {t("lp.final.cta")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="https://wa.me/5511918976343" target="_blank">
              <Button variant="outline" size="lg" className="gap-2 h-11 px-6 text-[14px]">
                {t("lp.final.contact")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                <Image src="/logo.png" alt="RepoLead" width={24} height={24} className="w-6 h-6 rounded-md object-contain" />
              </div>
              <span className="text-[13px] font-semibold text-foreground">RepoLead</span>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-4 text-[13px]">
              <div className="space-y-2">
                <p className="font-semibold text-foreground">{t("lp.footer.product")}</p>
                <a href="#product" className="block text-muted-foreground hover:text-foreground transition-colors">{t("lp.nav.product")}</a>
                <a href="#how" className="block text-muted-foreground hover:text-foreground transition-colors">{t("lp.nav.how")}</a>
                <a href="#usecases" className="block text-muted-foreground hover:text-foreground transition-colors">{t("lp.nav.usecases")}</a>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">{t("lp.footer.resources")}</p>
                <Link href="/docs" className="block text-muted-foreground hover:text-foreground transition-colors">{t("lp.footer.docs")}</Link>
                <a href="#faq" className="block text-muted-foreground hover:text-foreground transition-colors">{t("lp.nav.faq")}</a>
                <Link href="/changelog" className="block text-muted-foreground hover:text-foreground transition-colors">{t("lp.footer.status")}</Link>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">{t("lp.footer.company")}</p>
                <Link href="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">{t("lp.footer.privacy")}</Link>
                <Link href="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">{t("lp.footer.terms")}</Link>
                <Link href="/acceptable-use" className="block text-muted-foreground hover:text-foreground transition-colors">Politica de Uso Aceitavel (AUP)</Link>
                <a href="mailto:contato@repoleads.com" className="block text-muted-foreground hover:text-foreground transition-colors">{t("lp.footer.contact")}</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
            <p className="text-[12px] text-muted-foreground">© 2026 RepoLead. All rights reserved.</p>
            <button type="button" onClick={() => setLocale(locale === "pt" ? "en" : "pt")} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
              {locale === "pt" ? "English" : "Português"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ===== Sub-components ===== */

function DiagramBlock({ icon: Icon, label, sub, accent }: { icon: LucideIcon; label: string; sub: string; accent?: boolean }) {
  return (
    <div className={`flex flex-col items-center text-center px-4 py-3 rounded-xl border ${accent ? "border-primary bg-primary/5" : "border-border bg-surface-2"} min-w-[120px]`}>
      <Icon className={`w-5 h-5 mb-1.5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
      <span className="text-[11px] text-muted-foreground mt-0.5">{sub}</span>
    </div>
  );
}

function TimelineEntry({ time, label, status, detail }: { time: string; label: string; status: "success" | "error" | "warning" | "info"; detail: string }) {
  const colors = {
    success: "bg-success/10 text-success border-success/20",
    error: "bg-destructive/10 text-destructive border-destructive/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    info: "bg-primary/10 text-primary border-primary/20",
  };
  return (
    <div className="flex items-center gap-3 text-[12px]">
      <span className="font-mono text-muted-foreground w-[58px] shrink-0">{time}</span>
      <span className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${colors[status]}`}>{label}</span>
      <span className="text-muted-foreground truncate">{detail}</span>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-accent/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-[14px] font-medium text-foreground pr-4">{question}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 animate-slide-up">
          <p className="text-[13px] text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

/* ===== Platform Preview Tabs ===== */

function PreviewTabs({ t }: { t: TranslationFn }) {
  const [tab, setTab] = useState<0 | 1 | 2>(0);
  const tabs = [t("lp.preview.tab1"), t("lp.preview.tab2"), t("lp.preview.tab3")];

  return (
    <div>
      <div className="flex items-center gap-1 mb-6 bg-surface-3 rounded-lg p-1 max-w-lg mx-auto">
        {tabs.map((label, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setTab(i as 0 | 1 | 2)}
            className={`flex-1 text-[12px] font-medium py-2 px-3 rounded-md transition-colors ${tab === i ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl p-6 overflow-x-auto">
        {tab === 0 && <PreviewSources />}
        {tab === 1 && <PreviewDedupe />}
        {tab === 2 && <PreviewTimeline />}
      </div>
    </div>
  );
}

function Badge({ children, variant = "default" }: { children: string; variant?: "success" | "warning" | "error" | "default" }) {
  const cls = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    error: "bg-destructive/10 text-destructive",
    default: "bg-muted text-muted-foreground",
  };
  return <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${cls[variant]}`}>{children}</span>;
}

function PreviewSources() {
  const rows = [
    { name: "Website Form", type: "Webhook", status: "Connected" as const, events: "1,247", last: "2 min ago" },
    { name: "Landing Page - Webinar", type: "API", status: "Connected" as const, events: "892", last: "5 min ago" },
    { name: "Meta Lead Ads", type: "Integration", status: "Needs attention" as const, events: "0", last: "2h ago" },
  ];
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="text-left text-[11px] text-muted-foreground uppercase tracking-wider border-b border-border">
          <th className="pb-3 font-medium">Source</th>
          <th className="pb-3 font-medium">Type</th>
          <th className="pb-3 font-medium">Status</th>
          <th className="pb-3 font-medium">Events today</th>
          <th className="pb-3 font-medium">Last event</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="border-b border-border last:border-0">
            <td className="py-3 font-medium text-foreground">{r.name}</td>
            <td className="py-3 text-muted-foreground">{r.type}</td>
            <td className="py-3"><Badge variant={r.status === "Connected" ? "success" : "warning"}>{r.status}</Badge></td>
            <td className="py-3 text-muted-foreground font-mono">{r.events}</td>
            <td className="py-3 text-muted-foreground">{r.last}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PreviewDedupe() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-surface-2 rounded-lg p-4 border border-border">
        <GitMerge className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground">Merge detectado</p>
          <p className="text-[12px] text-muted-foreground">maria@empresa.com encontrado em 2 sources → merge automático</p>
        </div>
        <Badge variant="success">Merged</Badge>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-[11px] text-muted-foreground uppercase tracking-wider border-b border-border">
            <th className="pb-3 font-medium">Lead</th>
            <th className="pb-3 font-medium">Email</th>
            <th className="pb-3 font-medium">Sources</th>
            <th className="pb-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="py-3 font-medium text-foreground">Maria Silva</td>
            <td className="py-3 text-muted-foreground font-mono text-[12px]">maria@empresa.com</td>
            <td className="py-3 text-muted-foreground">website-form, webinar-lp</td>
            <td className="py-3"><Badge variant="success">Merged</Badge></td>
          </tr>
          <tr className="border-b border-border">
            <td className="py-3 font-medium text-foreground">João Oliveira</td>
            <td className="py-3 text-muted-foreground font-mono text-[12px]">joao@startup.io</td>
            <td className="py-3 text-muted-foreground">meta-ads</td>
            <td className="py-3"><Badge variant="default">Unique</Badge></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PreviewTimeline() {
  const entries = [
    { time: "14:32:01", event: "lead.created", detail: "source: website-form", status: "success" as const },
    { time: "14:32:02", event: "lead.merged", detail: "ld_8f3k → ld_2a1m", status: "success" as const },
    { time: "14:32:03", event: "delivery.sent", detail: "dest: hubspot-webhook → 200", status: "success" as const },
    { time: "14:32:03", event: "delivery.failed", detail: "dest: slack-notify → 503", status: "error" as const },
    { time: "14:32:08", event: "delivery.retry", detail: "attempt 2/5 → slack-notify", status: "warning" as const },
    { time: "14:33:12", event: "delivery.sent", detail: "dest: slack-notify → 200", status: "success" as const },
  ];
  const dotColors = { success: "bg-success", error: "bg-destructive", warning: "bg-warning" };
  return (
    <div className="space-y-0">
      {entries.map((e, i) => (
        <div key={i} className="flex items-start gap-4 py-3 border-b border-border last:border-0">
          <span className="font-mono text-[12px] text-muted-foreground w-[60px] shrink-0 pt-0.5">{e.time}</span>
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColors[e.status]}`} />
          <div className="flex-1 min-w-0">
            <span className="text-[13px] font-medium text-foreground">{e.event}</span>
            <span className="text-[12px] text-muted-foreground ml-2">{e.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
