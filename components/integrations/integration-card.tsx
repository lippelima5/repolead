import { ComponentType } from "react";
import { Bell, Blocks, Braces, Code2, FileCode, FileInput, GitBranch, Megaphone, MessageSquare, Puzzle, Send, Webhook, Workflow, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/i18n-context";
import { IntegrationCatalogItem } from "@/lib/integrations/types";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Webhook,
  FileInput,
  Send,
  Blocks,
  Megaphone,
  Zap,
  Workflow,
  GitBranch,
  Code2,
  Braces,
  FileCode,
  MessageSquare,
  Puzzle,
  Bell,
};

export function IntegrationCard({
  integration,
  onSetup,
  onNotify,
}: {
  integration: IntegrationCatalogItem;
  onSetup: (integration: IntegrationCatalogItem) => void;
  onNotify?: (integration: IntegrationCatalogItem) => void;
}) {
  const { locale, t } = useI18n();
  const Icon = iconMap[integration.icon] || Webhook;
  const isSoon = integration.availability === "soon";
  const directionLabel = integration.direction === "source" ? t("integrations.source") : t("integrations.destination");
  const badgeLabel =
    integration.badge === "popular"
      ? t("integrations.badge_popular")
      : integration.badge === "soon"
        ? t("integrations.badge_soon")
        : null;

  return (
    <div
      className={cn(
        "group bg-card border border-border rounded-xl p-4 flex flex-col transition-all duration-150",
        isSoon ? "opacity-75" : "hover:border-primary/30 cursor-pointer",
      )}
      onClick={() => (!isSoon ? onSetup(integration) : undefined)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-2 border border-border">
            <Icon className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-foreground leading-tight">{integration.title}</h3>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              {directionLabel}
            </span>
          </div>
        </div>
        {badgeLabel ? (
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              integration.badge === "popular"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {badgeLabel}
          </span>
        ) : null}
      </div>

      <p className="text-[12px] text-muted-foreground leading-relaxed flex-1 mb-4">{integration.short_description[locale]}</p>

      {isSoon ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-[12px]"
          onClick={(event) => {
            event.stopPropagation();
            onNotify?.(integration);
          }}
        >
          {t("common.notify_me")}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-[12px] group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors duration-150"
          onClick={(event) => {
            event.stopPropagation();
            onSetup(integration);
          }}
        >
          {t("common.set_up")}
        </Button>
      )}
    </div>
  );
}
