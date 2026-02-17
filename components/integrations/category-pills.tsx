import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/i18n-context";

const categories = [
  { key: "all", label: "All" },
  { key: "webhooks", label: "Webhooks" },
  { key: "forms", label: "Forms" },
  { key: "automation", label: "Automation" },
  { key: "ads", label: "Ads" },
  { key: "sdk", label: "SDK" },
  { key: "custom", label: "Custom" },
] as const;

export function CategoryPills({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (category: string) => void;
}) {
  const { locale } = useI18n();

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
          {locale === "pt" ? item.label : item.label}
        </button>
      ))}
    </div>
  );
}
