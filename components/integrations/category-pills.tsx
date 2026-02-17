import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/i18n-context";

const categories = [
  { key: "all", labelKey: "integrations.categories.all" },
  { key: "webhooks", labelKey: "integrations.categories.webhooks" },
  { key: "forms", labelKey: "integrations.categories.forms" },
  { key: "automation", labelKey: "integrations.categories.automation" },
  { key: "ads", labelKey: "integrations.categories.ads" },
  { key: "sdk", labelKey: "integrations.categories.sdk" },
  { key: "custom", labelKey: "integrations.categories.custom" },
] as const;

export function CategoryPills({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (category: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {categories.map((item) => (
        <button
          key={item.key}
          onClick={() => onSelect(item.key)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors duration-150",
            selected === item.key
              ? "bg-foreground text-background"
              : "bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground",
          )}
        >
          {t(item.labelKey)}
        </button>
      ))}
    </div>
  );
}
