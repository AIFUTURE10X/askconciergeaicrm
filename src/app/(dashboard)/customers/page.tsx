"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
  X,
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  Layers,
  BedDouble,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TIER_LABELS,
  TIER_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  VALID_TIERS,
  VALID_STATUSES,
} from "@/lib/admin/constants";
import type { AdminOrganization, AdminStats } from "@/lib/admin/types";
import { CustomerDetailPanel } from "@/components/customers/CustomerDetailPanel";
import { CustomerBulkActions } from "@/components/customers/CustomerBulkActions";
import { Checkbox } from "@/components/ui/checkbox";
import { HealthBadge } from "@/components/customers/health/HealthBadge";
import type { CustomerHealthData } from "@/lib/admin/health";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className="p-3 sm:p-4 flex items-center gap-3">
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

export default function CustomersPage() {
  const [orgs, setOrgs] = useState<AdminOrganization[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filters
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Sort
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // Health scores
  const [healthMap, setHealthMap] = useState<Map<string, number>>(new Map());

  // Detail panel
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === orgs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orgs.map((o) => o.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (tierFilter) params.set("tier", tierFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("sort", sort);
      params.set("order", order);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(`/api/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrgs(data.organizations);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, tierFilter, statusFilter, sort, order, page, limit]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/customers/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  const handleBulkRefresh = useCallback(() => {
    fetchCustomers();
    fetchStats();
  }, [fetchCustomers, fetchStats]);

  const fetchHealthScores = useCallback(async () => {
    try {
      const res = await fetch("/api/customers/health?sort=score&order=asc");
      if (res.ok) {
        const data = await res.json();
        const map = new Map<string, number>();
        for (const c of data.customers as CustomerHealthData[]) {
          map.set(c.orgId, c.breakdown.total);
        }
        setHealthMap(map);
      }
    } catch (error) {
      console.error("Error fetching health scores:", error);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchHealthScores();
  }, [fetchHealthScores]);

  // Reset to page 1 when filters change
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handleTierFilter = (value: string) => {
    setTierFilter(value);
    setPage(1);
  };
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const toggleSort = (column: string) => {
    if (sort === column) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(column);
      setOrder("asc");
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setTierFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const hasFilters = search || tierFilter || statusFilter;
  const totalPages = Math.ceil(total / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <>
      <Header title="Customers" description="Manage subscribed organizations" />

      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Orgs" value={stats.total} icon={Building2} color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" />
            <StatCard label="Active" value={stats.active} icon={TrendingUp} color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" />
            <StatCard label="Trialing" value={stats.trialing} icon={Clock} color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" />
            <StatCard label="New This Month" value={stats.newThisMonth} icon={Users} color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" />
            <StatCard label="Est. MRR" value={`$${stats.estimatedMrr.toLocaleString()}`} icon={DollarSign} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" />
            <StatCard label="Canceled" value={stats.canceled} icon={AlertTriangle} color="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" />
          </div>
        )}

        {/* Revenue Breakdown */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Base Revenue" value={`$${stats.baseMrr.toLocaleString()}/mo`} icon={DollarSign} color="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" />
            <StatCard label="Expansion Revenue" value={`$${stats.expansionMrr.toLocaleString()}/mo`} icon={TrendingUp} color="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" />
            <StatCard label="CRM Add-ons" value={`${stats.crmAddonCount} ($${stats.crmAddonMrr}/mo)`} icon={Layers} color="bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400" />
            <StatCard label="Total Units" value={stats.totalUnitsManaged.toLocaleString()} icon={BedDouble} color="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" />
          </div>
        )}

        {/* Tier breakdown badges */}
        {stats && (
          <div className="flex flex-wrap gap-2">
            {VALID_TIERS.map((tier) => (
              <Badge key={tier} variant="secondary" className={cn("text-xs", TIER_COLORS[tier])}>
                {TIER_LABELS[tier]}: {stats.byTier[tier] || 0}
              </Badge>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => handleTierFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All Tiers</option>
            {VALID_TIERS.map((t) => (
              <option key={t} value={t}>{TIER_LABELS[t]}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All Statuses</option>
            {VALID_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Bulk Actions */}
        <CustomerBulkActions
          selectedCount={selectedIds.size}
          selectedIds={Array.from(selectedIds)}
          onClearSelection={clearSelection}
          onRefresh={handleBulkRefresh}
        />

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No organizations found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <Checkbox
                        checked={orgs.length > 0 && selectedIds.size === orgs.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </th>
                    <SortHeader label="Organization" column="name" sort={sort} order={order} onSort={toggleSort} />
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
                    <SortHeader label="Tier" column="tier" sort={sort} order={order} onSort={toggleSort} />
                    <SortHeader label="Status" column="status" sort={sort} order={order} onSort={toggleSort} />
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Health</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Properties</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Members</th>
                    <SortHeader label="Created" column="createdAt" sort={sort} order={order} onSort={toggleSort} />
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orgs.map((org) => (
                    <tr key={org.id} className={cn("hover:bg-muted/30 transition-colors", selectedIds.has(org.id) && "bg-primary/5")}>
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.has(org.id)}
                          onCheckedChange={() => toggleSelect(org.id)}
                          aria-label={`Select ${org.name}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/customers/${org.id}`} className="font-medium hover:underline">
                          {org.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{org.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {org.owner ? (
                          <div>
                            <p className="text-sm">{org.owner.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{org.owner.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs">No owner</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={cn("text-xs", TIER_COLORS[org.pricingTier || "ruby"])}>
                          {TIER_LABELS[org.pricingTier || "ruby"] || org.pricingTier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className={cn("text-xs", STATUS_COLORS[org.subscriptionStatus || "trialing"])}>
                          {STATUS_LABELS[org.subscriptionStatus || "trialing"] || org.subscriptionStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {healthMap.has(org.id) ? (
                          <HealthBadge score={healthMap.get(org.id)!} />
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{org.propertyCount}</td>
                      <td className="px-4 py-3 text-muted-foreground">{org.memberCount}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedOrgId(org.id)}
                            title="Quick view"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/customers/${org.id}`}>Details</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {startItem}–{endItem} of {total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail slide-over panel */}
      {selectedOrgId && (
        <CustomerDetailPanel
          orgId={selectedOrgId}
          onClose={() => setSelectedOrgId(null)}
        />
      )}
    </>
  );
}

function SortHeader({
  label,
  column,
  sort,
  order,
  onSort,
}: {
  label: string;
  column: string;
  sort: string;
  order: "asc" | "desc";
  onSort: (column: string) => void;
}) {
  return (
    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        <ArrowUpDown className={cn("h-3 w-3", sort === column && "text-foreground")} />
        {sort === column && (
          <span className="text-[10px]">{order === "asc" ? "↑" : "↓"}</span>
        )}
      </button>
    </th>
  );
}
