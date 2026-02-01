import { db } from "@/lib/db";
import { eq, sql, gte } from "drizzle-orm";
import {
  organizations,
  properties,
  units,
  crmSubscriptions,
} from "@/lib/db/schema/main-app-tables";
import type { AdminStats } from "./types";
import { calculateAccountMonthlyTotal } from "./billing";

export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totals] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(organizations);

  const statusCounts = await db
    .select({
      status: organizations.subscriptionStatus,
      count: sql<number>`count(*)::int`,
    })
    .from(organizations)
    .groupBy(organizations.subscriptionStatus);

  const tierCounts = await db
    .select({
      tier: organizations.pricingTier,
      count: sql<number>`count(*)::int`,
    })
    .from(organizations)
    .groupBy(organizations.pricingTier);

  const [newThisMonth] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(organizations)
    .where(gte(organizations.createdAt, monthStart));

  // Fetch active orgs with expansion fields
  const activeOrgs = await db
    .select({
      pricingTier: organizations.pricingTier,
      billingPeriod: organizations.billingPeriod,
      extraPropertiesCount: organizations.extraPropertiesCount,
      extraUnitsCount: organizations.extraUnitsCount,
      id: organizations.id,
    })
    .from(organizations)
    .where(eq(organizations.subscriptionStatus, "active"));

  // Fetch active CRM subscriptions
  const activeCrmSubs = await db
    .select({
      organizationId: crmSubscriptions.organizationId,
      billingPeriod: crmSubscriptions.billingPeriod,
    })
    .from(crmSubscriptions)
    .where(eq(crmSubscriptions.status, "active"));

  const crmSubMap = new Map(
    activeCrmSubs.map((s) => [s.organizationId, s.billingPeriod])
  );

  // Total units managed across all active orgs
  const [totalUnitsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(units)
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .innerJoin(organizations, eq(properties.organizationId, organizations.id))
    .where(eq(organizations.subscriptionStatus, "active"));

  // Compute MRR breakdown
  let baseMrr = 0;
  let expansionMrr = 0;
  let crmAddonMrr = 0;
  for (const org of activeOrgs) {
    const hasCrm = crmSubMap.has(org.id);
    const crmPeriod = crmSubMap.get(org.id) || "monthly";
    const breakdown = calculateAccountMonthlyTotal(org, hasCrm, crmPeriod);
    baseMrr += breakdown.baseMrr;
    expansionMrr += breakdown.extraPropertiesMrr + breakdown.extraUnitsMrr;
    crmAddonMrr += breakdown.crmAddonMrr;
  }

  const estimatedMrr = baseMrr + expansionMrr + crmAddonMrr;

  const byStatus: Record<string, number> = {};
  for (const s of statusCounts) {
    byStatus[s.status || "unknown"] = s.count;
  }

  const byTier: Record<string, number> = {};
  for (const t of tierCounts) {
    byTier[t.tier || "unknown"] = t.count;
  }

  return {
    total: totals?.count || 0,
    active: byStatus["active"] || 0,
    trialing: byStatus["trialing"] || 0,
    pastDue: byStatus["past_due"] || 0,
    canceled: byStatus["canceled"] || 0,
    newThisMonth: newThisMonth?.count || 0,
    estimatedMrr: Math.round(estimatedMrr),
    baseMrr: Math.round(baseMrr),
    expansionMrr: Math.round(expansionMrr),
    crmAddonMrr: Math.round(crmAddonMrr),
    crmAddonCount: activeCrmSubs.length,
    totalUnitsManaged: totalUnitsResult?.count || 0,
    byTier,
    byStatus,
  };
}
