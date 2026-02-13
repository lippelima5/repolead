export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "VibeKit",
  description: "Starter kit Next.js para agentes de IA com auth, multi-workspace e billing.",
  links: {
    home: "/",
    login: "/login",
    register: "/register",
    dashboard: "/dashboard",
    blog: "/blog",
    changelog: "/changelog",
    github: "https://github.com",
  },
  navigation: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "FAQ", href: "#faq" },
    { label: "Blog", href: "/blog" },
    { label: "Changelog", href: "/changelog" },
  ],
  footerColumns: [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Changelog", href: "/changelog" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Blog", href: "/blog" },
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

