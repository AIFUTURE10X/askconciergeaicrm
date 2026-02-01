"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIER_LABELS, TIER_COLORS, STATUS_LABELS, STATUS_COLORS, VALID_TIERS } from "@/lib/admin/constants";
import { CustomerStatsBar } from "@/components/customers/CustomerStatsBar";
import { CustomerDetailPanel } from "@/components/customers/CustomerDetailPanel";
import { CustomerBulkActions } from "@/components/customers/CustomerBulkActions";
import { CustomerFiltersBar } from "@/components/customers/CustomerFiltersBar";
import { SortHeader } from "@/components/customers/SortHeader";
import { ExpansionBadges } from "@/components/customers/ExpansionBadges";
import { Checkbox } from "@/components/ui/checkbox";
import { HealthBadge } from "@/components/customers/health/HealthBadge";
import { useCustomers } from "./useCustomers";

export default function CustomersPage() {
  const c = useCustomers();

  return (
    <>
      <Header title="Customers" description="Manage subscribed organizations" />

      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        {c.stats && (
          <CustomerStatsBar stats={c.stats} activeCard={c.activeCard} onCardClick={c.handleCardClick} />
        )}

        {c.stats && (
          <div className="flex flex-wrap gap-2">
            {VALID_TIERS.map((tier) => (
              <Badge key={tier} variant="secondary" className={cn("text-xs", TIER_COLORS[tier])}>
                {TIER_LABELS[tier]}: {c.stats!.byTier[tier] || 0}
              </Badge>
            ))}
          </div>
        )}

        <CustomerFiltersBar
          search={c.search} tierFilter={c.tierFilter} statusFilter={c.statusFilter}
          monthFilter={c.monthFilter} monthOptions={c.monthOptions} hasFilters={c.hasFilters}
          onSearch={c.handleSearch} onTierFilter={c.handleTierFilter}
          onStatusFilter={c.handleStatusFilter} onMonthFilter={c.handleMonthFilter}
          onClear={c.clearFilters}
        />

        <CustomerBulkActions
          selectedCount={c.selectedIds.size}
          selectedIds={Array.from(c.selectedIds)}
          onClearSelection={c.clearSelection}
          onRefresh={c.handleBulkRefresh}
        />

        {c.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : c.orgs.length === 0 ? (
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
                        checked={c.orgs.length > 0 && c.selectedIds.size === c.orgs.length}
                        onCheckedChange={c.toggleSelectAll}
                        aria-label="Select all"
                      />
                    </th>
                    <SortHeader label="Organization" column="name" sort={c.sort} order={c.order} onSort={c.toggleSort} />
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
                    <SortHeader label="Tier" column="tier" sort={c.sort} order={c.order} onSort={c.toggleSort} />
                    <SortHeader label="Status" column="status" sort={c.sort} order={c.order} onSort={c.toggleSort} />
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Health</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Properties</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Members</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expansion</th>
                    <SortHeader label="Created" column="createdAt" sort={c.sort} order={c.order} onSort={c.toggleSort} />
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {c.orgs.map((org) => (
                    <tr key={org.id} className={cn("hover:bg-muted/30 transition-colors", c.selectedIds.has(org.id) && "bg-primary/5")}>
                      <td className="px-4 py-3">
                        <Checkbox checked={c.selectedIds.has(org.id)} onCheckedChange={() => c.toggleSelect(org.id)} aria-label={`Select ${org.name}`} />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/customers/${org.id}`} className="font-medium hover:underline">{org.name}</Link>
                        <p className="text-xs text-muted-foreground">{org.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {org.owner ? (
                          <div>
                            <p className="text-sm">{org.owner.name || "\u2014"}</p>
                            <p className="text-xs text-muted-foreground">{org.owner.email}</p>
                          </div>
                        ) : <span className="text-xs">No owner</span>}
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
                        {c.healthMap.has(org.id) ? <HealthBadge score={c.healthMap.get(org.id)!} /> : <span className="text-xs text-muted-foreground">-</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{org.propertyCount}</td>
                      <td className="px-4 py-3 text-muted-foreground">{org.memberCount}</td>
                      <td className="px-4 py-3"><ExpansionBadges org={org} /></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(org.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => c.setSelectedOrgId(org.id)} title="Quick view">
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

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing {c.startItem}&ndash;{c.endItem} of {c.total}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={c.page <= 1} onClick={() => c.setPage(c.page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>Page {c.page} of {c.totalPages}</span>
                <Button variant="outline" size="sm" disabled={c.page >= c.totalPages} onClick={() => c.setPage(c.page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {c.selectedOrgId && (
        <CustomerDetailPanel orgId={c.selectedOrgId} onClose={() => c.setSelectedOrgId(null)} />
      )}
    </>
  );
}
