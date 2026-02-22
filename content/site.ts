export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "RepoLead",
  description: "Plataforma API-first para captura, dedupe e distribuição confiável de leads por workspace.",
  links: {
    home: "/",
    login: "/login",
    register: "/register",
    dashboard: "/dashboard",
    docs: "/docs",
    blog: "/blog",
    changelog: "/changelog",
    github: "https://github.com",
  },
  navigation: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "FAQ", href: "#faq" },
    { label: "Docs", href: "/docs" },
    { label: "Blog", href: "/blog" },
    { label: "Changelog", href: "/changelog" },
  ],
  footerColumns: [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Docs", href: "/docs" },
        { label: "Changelog", href: "/changelog" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Blog", href: "/blog" },
        { label: "Docs", href: "/docs" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Login", href: "/login" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    },
  ],
} as const;

