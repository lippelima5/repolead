"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  Bell,
  ChevronLeft,
  ChevronRight,
  Globe,
  LayoutDashboard,
  LogOut,
  Moon,
  Monitor,
  Radio,
  Send,
  Settings,
  Sun,
  User,
  Users,
  Webhook,
  Zap,
  PlugZap,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useTheme } from "@/contexts/theme-context";
import { useI18n } from "@/contexts/i18n-context";
import { useAuth } from "@/contexts/auth-context";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { href: "/integrations", icon: PlugZap, labelKey: "nav.integrations" },
  { href: "/sources", icon: Radio, labelKey: "nav.sources" },
  { href: "/destinations", icon: Webhook, labelKey: "nav.destinations" },
  { href: "/leads", icon: Users, labelKey: "nav.leads" },
  { href: "/ingestions", icon: Activity, labelKey: "nav.ingestions" },
  { href: "/deliveries", icon: Send, labelKey: "nav.deliveries" },
  { href: "/alerts", icon: Bell, labelKey: "nav.alerts" },
  { href: "/settings", icon: Settings, labelKey: "nav.settings" },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const { user, logout } = useAuth();

  const themeIconMap = { light: Sun, dark: Moon, system: Monitor } as const;
  const nextTheme = { light: "dark", dark: "system", system: "light" } as const;
  const ThemeIcon = themeIconMap[theme];

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-200 h-screen sticky top-0",
        collapsed ? "w-[56px]" : "w-[240px]",
      )}
    >
      <div className="flex items-center gap-2.5 px-3.5 h-[56px] border-b border-border">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
          <Zap className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        {!collapsed ? <span className="font-semibold text-sm text-foreground tracking-tight">LeadVault</span> : null}
      </div>

      {!collapsed ? (
        <div className="px-2 pt-2 pb-1">
          <WorkspaceSwitcher />
        </div>
      ) : null}

      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-colors duration-150",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed ? <span>{t(item.labelKey)}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-2 space-y-1">
        <button
          onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
          className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors duration-150 w-full"
        >
          <Globe className="w-4 h-4 shrink-0" />
          {!collapsed ? <span>{locale === "pt" ? "EN" : "PT"}</span> : null}
        </button>

        <button
          onClick={() => setTheme(nextTheme[theme])}
          className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors duration-150 w-full"
        >
          <ThemeIcon className="w-4 h-4 shrink-0" />
          {!collapsed ? <span className="capitalize">{theme}</span> : null}
        </button>

        {user ? (
          <div
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-border bg-surface-2 text-[12px]",
              collapsed && "justify-center",
            )}
          >
            {!collapsed ? (
              <>
                <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold">
                  {getInitials(user.name || user.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-foreground font-medium">{user.name || user.email}</p>
                  <p className="truncate text-muted-foreground">{user.email}</p>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                  aria-label="Profile"
                >
                  <User className="w-4 h-4" />
                </Link>
                <button
                  onClick={logout}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={logout} className="text-muted-foreground hover:text-foreground" aria-label="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : null}

        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex items-center justify-center w-full py-[7px] rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors duration-150"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
