import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { TIER_LABELS, VALID_TIERS, STATUS_LABELS, VALID_STATUSES } from "@/lib/admin/constants";

interface CustomerFiltersBarProps {
  search: string;
  tierFilter: string;
  statusFilter: string;
  monthFilter: string;
  monthOptions: { value: string; label: string }[];
  hasFilters: boolean;
  onSearch: (value: string) => void;
  onTierFilter: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onMonthFilter: (value: string) => void;
  onClear: () => void;
}

export function CustomerFiltersBar({
  search, tierFilter, statusFilter, monthFilter, monthOptions,
  hasFilters, onSearch, onTierFilter, onStatusFilter, onMonthFilter, onClear,
}: CustomerFiltersBarProps) {
  return (
    <div className="flex gap-3 flex-wrap items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <select
        value={tierFilter}
        onChange={(e) => onTierFilter(e.target.value)}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="">All Tiers</option>
        {VALID_TIERS.map((t) => (
          <option key={t} value={t}>{TIER_LABELS[t]}</option>
        ))}
      </select>
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilter(e.target.value)}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="">All Statuses</option>
        {VALID_STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
      <select
        value={monthFilter}
        onChange={(e) => onMonthFilter(e.target.value)}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="">All Time</option>
        {monthOptions.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-4 w-4 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}
