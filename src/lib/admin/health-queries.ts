import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { organizations } from "@/lib/db/schema/main-app-tables";
import type { CustomerHealthData, HealthDashboardStats } from "./health";
import { getHealthDataForOrgs } from "./health-data-fetcher";

// Re-export for backwards compatibility
export { getHealthDataForOrgs } from "./health-data-fetcher";
export { type TrialOnboardingData, getTrialOnboardingData } from "./trial-queries";
export { type UpgradeOpportunity, type UpgradeTrigger } from "./upgrade-queries";

export async function getAllCustomerHealth(filters?: {
  category?: string;
  tier?: string;
  sort?: string;
  order?: "asc" | "desc";
}): Promise<{ customers: CustomerHealthData[]; stats: HealthDashboardStats }> {
  // Get all active/trialing org IDs
  const allOrgs = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(
      sql`${organizations.subscriptionStatus} IN ('active', 'trialing', 'past_due')`
    );

  const orgIds = allOrgs.map((o) => o.id);
  let customers = await getHealthDataForOrgs(orgIds);

  // Filter by category
  if (filters?.category) {
    customers = customers.filter((c) => c.breakdown.category === filters.category);
  }
  // Filter by tier
  if (filters?.tier) {
    customers = customers.filter((c) => c.pricingTier === filters.tier);
  }

  // Sort
  const sortField = filters?.sort || "score";
  const sortOrder = filters?.order || "asc";
  customers.sort((a, b) => {
    let cmp = 0;
    if (sortField === "score") cmp = a.breakdown.total - b.breakdown.total;
    else if (sortField === "name") cmp = a.orgName.localeCompare(b.orgName);
    else if (sortField === "usage") cmp = a.usagePercent - b.usagePercent;
    else if (sortField === "engagement") cmp = a.chatSessionsLast30d - b.chatSessionsLast30d;
    else cmp = a.breakdown.total - b.breakdown.total;

    return sortOrder === "desc" ? -cmp : cmp;
  });

  // Compute stats from all (unfiltered) customers
  const allCustomers = filters?.category || filters?.tier
    ? await getHealthDataForOrgs(orgIds)
    : customers;

  const stats = computeHealthStats(allCustomers);

  return { customers, stats };
}

export async function getSingleCustomerHealth(orgId: string): Promise<CustomerHealthData | null> {
  const results = await getHealthDataForOrgs([orgId]);
  return results[0] || null;
}

function computeHealthStats(customers: CustomerHealthData[]): HealthDashboardStats {
  if (customers.length === 0) {
    return { avgScore: 0, healthyCount: 0, atRiskCount: 0, criticalCount: 0, totalCustomers: 0 };
  }

  const totalScore = customers.reduce((sum, c) => sum + c.breakdown.total, 0);
  const healthyCount = customers.filter((c) => c.breakdown.category === "healthy").length;
  const atRiskCount = customers.filter((c) => c.breakdown.category === "atRisk").length;
  const criticalCount = customers.filter((c) => c.breakdown.category === "critical").length;

  return {
    avgScore: Math.round(totalScore / customers.length),
    healthyCount,
    atRiskCount,
    criticalCount,
    totalCustomers: customers.length,
  };
}
