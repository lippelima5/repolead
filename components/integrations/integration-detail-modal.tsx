import { ArrowRight, Bell, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IntegrationCatalogItem } from "@/content/integrations-catalog";
import { useI18n } from "@/contexts/i18n-context";

export function IntegrationDetailModal({
  integration,
  open,
  onOpenChange,
  returnTo = "/integrations",
}: {
  integration: IntegrationCatalogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnTo?: string;
}) {
  const router = useRouter();
  const { locale, t } = useI18n();

  if (!integration) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground text-[15px]">{integration.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <p className="text-[13px] text-muted-foreground leading-relaxed">{integration.description[locale]}</p>

          {(integration.direction === "source" || integration.direction === "both") && integration.availability !== "soon" ? (
            <div className="bg-surface-2 rounded-xl p-3 border border-border space-y-1.5">
              <p className="text-[11px] font-semibold text-foreground uppercase tracking-wide">{t("integrations.endpoint_title")}</p>
              <code className="block text-[11px] font-mono text-primary bg-background rounded-lg px-3 py-2 border border-border">
                POST /api/v1/leads/ingest
              </code>
            </div>
          ) : null}

          <div className="flex items-center gap-2 pt-1">
            {integration.availability === "soon" ? (
              <Button className="flex-1 h-9 text-[13px] gap-2">
                <Bell className="w-3.5 h-3.5" />
                {t("common.notify_me")}
              </Button>
            ) : (
              <Button
                className="flex-1 h-9 text-[13px] gap-2"
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/integrations/configure/${integration.id}?returnTo=${encodeURIComponent(returnTo)}`);
                }}
              >
                {t("common.set_up")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-[12px] gap-1.5"
              onClick={() => {
                const docsUrl = "https://docs.leadvault.dev";
                window.open(docsUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <ExternalLink className="w-3 h-3" />
              {t("common.docs")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
