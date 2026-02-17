"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CategoryPills } from "@/components/integrations/category-pills";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { integrationsCatalog } from "@/lib/integrations/catalog";
import { IntegrationDirection } from "@/lib/integrations/types";
import { useI18n } from "@/contexts/i18n-context";

export function IntegrationGrid({
  filterDirection,
  configureBasePath,
  returnTo,
}: {
  filterDirection: IntegrationDirection;
  configureBasePath: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(
    () =>
      integrationsCatalog.filter((item) => {
        if (item.direction !== filterDirection) {
          return false;
        }

        if (category !== "all" && item.category !== category) {
          return false;
        }

        if (search.trim()) {
          const query = search.toLowerCase();
          return (
            item.title.toLowerCase().includes(query) ||
            item.short_description.pt.toLowerCase().includes(query) ||
            item.short_description.en.toLowerCase().includes(query)
          );
        }

        return true;
      }),
    [category, filterDirection, search],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder={t("integrations.search_placeholder")}
            className="pl-9 h-8 text-[12px] bg-surface-2 border-border"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <CategoryPills selected={category} onSelect={setCategory} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onSetup={(item) => {
              const targetReturnTo = returnTo || `/${filterDirection}s?tab=browse`;
              router.push(`${configureBasePath}/${item.id}?returnTo=${encodeURIComponent(targetReturnTo)}`);
            }}
            onNotify={(item) => toast.success(`${item.title}: ${t("integrations.notify_waitlist")}`)}
          />
        ))}
      </div>

      {filtered.length === 0 ? <div className="text-center py-12 text-[13px] text-muted-foreground">{t("integrations.no_results")}</div> : null}
    </div>
  );
}
