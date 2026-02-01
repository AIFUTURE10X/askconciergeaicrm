import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortHeaderProps {
  label: string;
  column: string;
  sort: string;
  order: "asc" | "desc";
  onSort: (column: string) => void;
}

export function SortHeader({ label, column, sort, order, onSort }: SortHeaderProps) {
  return (
    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        <ArrowUpDown className={cn("h-3 w-3", sort === column && "text-foreground")} />
        {sort === column && (
          <span className="text-[10px]">{order === "asc" ? "\u2191" : "\u2193"}</span>
        )}
      </button>
    </th>
  );
}
