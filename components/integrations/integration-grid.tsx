"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CategoryPills } from "@/components/integrations/category-pills";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { IntegrationDetailModal } from "@/components/integrations/integration-detail-modal";
import { integrationsCatalog, IntegrationDirection, IntegrationCatalogItem } from "@/content/integrations-catalog";

export function IntegrationGrid({ filterDirection }: { filterDirection?: IntegrationDirection }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationCatalogItem | null>(null);

  const filtered = useMemo(
    () =>
      integrationsCatalog.filter((item) => {
        if (filterDirection && item.direction !== filterDirection && item.direction !== "both") {
          return false;
        }

        if (category !== "all" && item.category !== category) {
          return false;
        }

        if (search.trim()) {
          const query = search.toLowerCase();
          return (
            item.name.toLowerCase().includes(query) ||
            item.description.pt.toLowerCase().includes(query) ||
            item.description.en.toLowerCase().includes(query)
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
            placeholder="Search integrations..."
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
            onSetup={setSelectedIntegration}
            onNotify={(item) => toast.success(`${item.name} waitlist joined`)}
          />
        ))}
      </div>

      {filtered.length === 0 ? <div className="text-center py-12 text-[13px] text-muted-foreground">No results</div> : null}

      <IntegrationDetailModal
        integration={selectedIntegration}
        open={Boolean(selectedIntegration)}
        onOpenChange={(open) => (!open ? setSelectedIntegration(null) : undefined)}
      />
    </div>
  );
}
