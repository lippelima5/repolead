import Link from "next/link";
import { Check, Shield, Users, Zap } from "lucide-react";
import { LandingFooter } from "@/components/sections/landing-footer";
import { LandingHeader } from "@/components/sections/landing-header";
import { LandingHero } from "@/components/sections/landing-hero";
import { siteConfig } from "@/content/site";

const features = [
  {
    icon: Zap,
    title: "Fast setup",
    description: "Start from a working baseline with auth, API routes, Prisma and billing flow.",
  },
  {
    icon: Users,
    title: "Multi-workspace",
    description: "Workspace roles and guards are ready for collaborative SaaS products.",
  },
  {
    icon: Shield,
    title: "Security-first",
    description: "JWT, httpOnly cookies, route protection and rate limiting already integrated.",
  },
];

type Plan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "$0",
    description: "For validation and small internal tools.",
    features: ["Core auth", "Workspace support", "Basic templates"],
  },
  {
    name: "Pro",
    price: "$29",
    description: "For teams shipping production products.",
    features: ["Billing ready", "Invite flow", "Admin tools"],
    highlighted: true,
  },
  {
    name: "Scale",
    price: "Custom",
    description: "For custom enterprise requirements.",
    features: ["Priority support", "Architecture guidance", "Custom integrations"],
  },
];

const faqs = [
  {
    question: "Does it use Server Actions?",
    answer: "No. Protected reads and writes use API route handlers.",
  },
  {
    question: "Can I adapt this to my own domain model?",
    answer: "Yes. The project is organized with small modules to help iterative extension.",
  },
  {
    question: "Is workspace access isolated?",
    answer: "Yes. API guards validate membership and workspace role before each operation.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      <main>
        <LandingHero />

        <section id="features" className="border-y border-border bg-card px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Features</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">Built for pragmatic delivery</h2>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="rounded-xl border border-border bg-background p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <feature.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Pricing</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">Simple plans</h2>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`rounded-xl border bg-card p-8 ${plan.highlighted ? "border-primary" : "border-border"}`}
                >
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mt-6 text-4xl font-bold">{plan.price}</p>

                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={siteConfig.links.register}
                    className="mt-8 block rounded-lg bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground"
                  >
                    Get started
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="border-y border-border bg-card px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Testimonials</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">Built to be extended</h2>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              <article className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
                The codebase is straightforward to evolve with new modules.
              </article>
              <article className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
                Auth + workspace rules were clear and production-friendly from day one.
              </article>
              <article className="rounded-xl border border-border bg-background p-6 text-sm text-muted-foreground">
                Great base to ship AI SaaS features without rebuilding boilerplate.
              </article>
            </div>
          </div>
        </section>

        <section id="faq" className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">FAQ</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">Common questions</h2>
            </div>

            <div className="mt-12 space-y-3">
              {faqs.map((faq) => (
                <details key={faq.question} className="rounded-lg border border-border bg-card p-4">
                  <summary className="cursor-pointer text-sm font-medium">{faq.question}</summary>
                  <p className="mt-3 text-sm text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">Start building now</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Create your account and continue in dashboard, or sign in if you already have one.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={siteConfig.links.register}
                className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
              >
                Get started
              </Link>
              <Link href={siteConfig.links.login} className="rounded-lg border border-border px-6 py-3 text-sm font-medium">
                Login
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}


