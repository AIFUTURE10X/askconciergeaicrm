import { cn } from "@/lib/utils";

interface FilterTab {
  id: string;
  label: string;
}

interface FilterTabsProps {
  label: string;
  tabs: FilterTab[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function FilterTabs({ label, tabs, selected, onSelect }: FilterTabsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-medium">{label}:</span>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "px-2 py-1 text-xs rounded-md transition-colors",
          selected === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80"
        )}
      >
        All
      </button>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          className={cn(
            "px-2 py-1 text-xs rounded-md transition-colors",
            selected === tab.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
