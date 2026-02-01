"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  Layers,
  BedDouble,
} from "lucide-react";
import type { AdminStats } from "@/lib/admin/types";

export type ActiveCardFilter =
  | "total"
  | "active"
  | "trialing"
  | "newThisMonth"
  | "canceled"
  | "crmAddons"
  | null;

interface CustomerStatsBarProps {
  stats: AdminStats;
  activeCard: ActiveCardFilter;
  onCardClick: (card: ActiveCardFilter) => void;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  onClick,
  isActive,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  const isClickable = !!onClick;

  return (
    <Card
      className={cn(
        "p-3 sm:p-4 flex items-center gap-3 transition-all",
        isClickable && "cursor-pointer hover:bg-muted/50",
        isActive && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </Card>
  );
}

export function CustomerStatsBar({
  stats,
  activeCard,
  onCardClick,
}: CustomerStatsBarProps) {
  return (
    <>
      {/* Main Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total Orgs"
          value={stats.total}
          icon={Building2}
          color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          onClick={() => onCardClick("total")}
          isActive={activeCard === "total"}
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={TrendingUp}
          color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          onClick={() => onCardClick("active")}
          isActive={activeCard === "active"}
        />
        <StatCard
          label="Trialing"
          value={stats.trialing}
          icon={Clock}
          color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          onClick={() => onCardClick("trialing")}
          isActive={activeCard === "trialing"}
        />
        <StatCard
          label="New This Month"
          value={stats.newThisMonth}
          icon={Users}
          color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          onClick={() => onCardClick("newThisMonth")}
          isActive={activeCard === "newThisMonth"}
        />
        <StatCard
          label="Est. MRR"
          value={`$${stats.estimatedMrr.toLocaleString()}`}
          icon={DollarSign}
          color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          label="Canceled"
          value={stats.canceled}
          icon={AlertTriangle}
          color="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          onClick={() => onCardClick("canceled")}
          isActive={activeCard === "canceled"}
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Base Revenue"
          value={`$${stats.baseMrr.toLocaleString()}/mo`}
          icon={DollarSign}
          color="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
        />
        <StatCard
          label="Expansion Revenue"
          value={`$${stats.expansionMrr.toLocaleString()}/mo`}
          icon={TrendingUp}
          color="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
        />
        <StatCard
          label="CRM Add-ons"
          value={`${stats.crmAddonCount} ($${stats.crmAddonMrr}/mo)`}
          icon={Layers}
          color="bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400"
          onClick={() => onCardClick("crmAddons")}
          isActive={activeCard === "crmAddons"}
        />
        <StatCard
          label="Total Units"
          value={stats.totalUnitsManaged.toLocaleString()}
          icon={BedDouble}
          color="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
        />
      </div>
    </>
  );
}
