import { useState, useEffect, useCallback, useMemo } from "react";
import type { AdminOrganization, AdminStats } from "@/lib/admin/types";
import type { ActiveCardFilter } from "@/components/customers/CustomerStatsBar";
import type { CustomerHealthData } from "@/lib/admin/health";

export function useCustomers() {
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
  const [monthFilter, setMonthFilter] = useState("");
  const [hasCrmAddon, setHasCrmAddon] = useState(false);
  const [activeCard, setActiveCard] = useState<ActiveCardFilter>(null);

  // Generate months from current month back to Jan 2026
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    const startYear = 2026;
    const startMonth = 0;
    for (let i = 0; ; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      if (d.getFullYear() < startYear || (d.getFullYear() === startYear && d.getMonth() < startMonth)) break;
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      options.push({ value, label });
    }
    return options;
  }, []);

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
      if (monthFilter) {
        const [year, month] = monthFilter.split("-").map(Number);
        params.set("dateFrom", new Date(year, month - 1, 1).toISOString());
        params.set("dateTo", new Date(year, month, 0, 23, 59, 59, 999).toISOString());
      }
      if (hasCrmAddon) params.set("hasCrmAddon", "true");
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
  }, [search, tierFilter, statusFilter, monthFilter, hasCrmAddon, sort, order, page, limit]);

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

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchHealthScores(); }, [fetchHealthScores]);

  // Reset to page 1 when filters change
  const handleSearch = (value: string) => { setSearch(value); setActiveCard(null); setPage(1); };
  const handleTierFilter = (value: string) => { setTierFilter(value); setActiveCard(null); setPage(1); };
  const handleStatusFilter = (value: string) => { setStatusFilter(value); setActiveCard(null); setPage(1); };
  const handleMonthFilter = (value: string) => { setMonthFilter(value); setActiveCard(null); setPage(1); };

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
    setSearch(""); setTierFilter(""); setStatusFilter(""); setMonthFilter("");
    setHasCrmAddon(false); setActiveCard(null); setPage(1);
  };

  const handleCardClick = (card: ActiveCardFilter) => {
    if (card === activeCard) { clearFilters(); return; }
    setSearch(""); setTierFilter(""); setStatusFilter(""); setMonthFilter("");
    setHasCrmAddon(false); setPage(1);
    switch (card) {
      case "total": break;
      case "active": setStatusFilter("active"); break;
      case "trialing": setStatusFilter("trialing"); break;
      case "newThisMonth": {
        const now = new Date();
        setMonthFilter(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
        break;
      }
      case "canceled": setStatusFilter("canceled"); break;
      case "crmAddons": setHasCrmAddon(true); break;
    }
    setActiveCard(card);
  };

  const hasFilters = !!(search || tierFilter || statusFilter || monthFilter || hasCrmAddon);
  const totalPages = Math.ceil(total / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return {
    orgs, stats, isLoading, total, page, setPage, limit,
    search, tierFilter, statusFilter, monthFilter, monthOptions,
    sort, order, healthMap, selectedOrgId, setSelectedOrgId,
    selectedIds, toggleSelect, toggleSelectAll, clearSelection,
    handleSearch, handleTierFilter, handleStatusFilter, handleMonthFilter,
    toggleSort, clearFilters, handleCardClick, handleBulkRefresh,
    hasFilters, totalPages, startItem, endItem, activeCard,
  };
}
