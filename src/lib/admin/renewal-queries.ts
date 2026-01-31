import { db } from "@/lib/db";
import { eq, sql, desc, and } from "drizzle-orm";
import { organizations, organizationMembers, users } from "@/lib/db/schema/main-app-tables";
import { churnReasons } from "@/lib/db/schema/tables";
import { getSingleCustomerHealth } from "./health-queries";

// ============================================
// Types
// ============================================

export interface RenewalCustomer {
  orgId: string;
  orgName: string;
  slug: string;
  pricingTier: string | null;
  subscriptionStatus: string | null;
  billingPeriod: string | null;
  stripeSubscriptionId: string | null;
  owner: { email: string; name: string | null } | null;
  healthScore: number | null;
  renewalUrgency: "this_week" | "this_month" | "next_month" | "later";
}

export interface ChurnRecord {
  id: string;
  orgId: string;
  orgName: string;
  slug: string;
  reason: string;
  details: string | null;
  healthScoreAtChurn: number | null;
  createdAt: Date;
}

export interface RenewalStats {
  upcomingThisWeek: number;
  upcomingThisMonth: number;
  recentChurnCount: number;
  topChurnReasons: Array<{ reason: string; count: number }>;
}

// ============================================
// Churn reason labels
// ============================================

export const CHURN_REASON_LABELS: Record<string, string> = {
  pricing: "Too expensive",
  not_using: "Not using the product",
  competitor: "Switched to competitor",
  missing_features: "Missing features",
  support: "Support issues",
  other: "Other",
};

export const CHURN_REASONS = Object.keys(CHURN_REASON_LABELS);

// ============================================
// Queries
// ============================================

export async function getRenewalPipelineData(): Promise<{
  customers: RenewalCustomer[];
  stats: RenewalStats;
}> {
  // Get all active orgs (they are the ones with renewals upcoming)
  const activeOrgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      pricingTier: organizations.pricingTier,
      subscriptionStatus: organizations.subscriptionStatus,
      billingPeriod: organizations.billingPeriod,
      stripeSubscriptionId: organizations.stripeSubscriptionId,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .where(eq(organizations.subscriptionStatus, "active"));

  const orgIds = activeOrgs.map((o) => o.id);

  // Fetch owners
  const ownerData = orgIds.length > 0
    ? await db
        .select({
          organizationId: organizationMembers.organizationId,
          email: users.email,
          name: users.name,
        })
        .from(organizationMembers)
        .innerJoin(users, eq(users.id, organizationMembers.userId))
        .where(
          and(
            eq(organizationMembers.role, "owner"),
            sql`${organizationMembers.organizationId} IN ${orgIds}`
          )
        )
    : [];

  const ownerMap = new Map(ownerData.map((o) => [o.organizationId, { email: o.email, name: o.name }]));

  // Estimate renewal date based on billing period and creation
  // Without direct Stripe period end data, we estimate monthly/annual cycles
  const now = new Date();
  const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const twoMonths = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const customers: RenewalCustomer[] = activeOrgs.map((org) => {
    // Estimate next renewal from billing period
    const period = org.billingPeriod === "annual" ? 365 : 30;
    const created = new Date(org.createdAt);
    const daysSinceCreated = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const daysTillNextRenewal = period - (daysSinceCreated % period);

    let renewalUrgency: RenewalCustomer["renewalUrgency"] = "later";
    if (daysTillNextRenewal <= 7) renewalUrgency = "this_week";
    else if (daysTillNextRenewal <= 30) renewalUrgency = "this_month";
    else if (daysTillNextRenewal <= 60) renewalUrgency = "next_month";

    return {
      orgId: org.id,
      orgName: org.name,
      slug: org.slug,
      pricingTier: org.pricingTier,
      subscriptionStatus: org.subscriptionStatus,
      billingPeriod: org.billingPeriod,
      stripeSubscriptionId: org.stripeSubscriptionId,
      owner: ownerMap.get(org.id) || null,
      healthScore: null, // Will be populated separately if needed
      renewalUrgency,
    };
  });

  // Get recent churn data
  const recentChurnReasons = await db
    .select({
      reason: churnReasons.reason,
      count: sql<number>`count(*)::int`,
    })
    .from(churnReasons)
    .groupBy(churnReasons.reason)
    .orderBy(desc(sql`count(*)`));

  const [churnCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(churnReasons);

  const stats: RenewalStats = {
    upcomingThisWeek: customers.filter((c) => c.renewalUrgency === "this_week").length,
    upcomingThisMonth: customers.filter((c) => c.renewalUrgency === "this_month").length,
    recentChurnCount: churnCount?.count || 0,
    topChurnReasons: recentChurnReasons.map((r) => ({
      reason: r.reason,
      count: r.count,
    })),
  };

  // Sort by urgency
  const urgencyOrder = { this_week: 0, this_month: 1, next_month: 2, later: 3 };
  customers.sort((a, b) => urgencyOrder[a.renewalUrgency] - urgencyOrder[b.renewalUrgency]);

  return { customers, stats };
}

export async function getRecentChurns(): Promise<ChurnRecord[]> {
  const records = await db
    .select({
      id: churnReasons.id,
      organizationId: churnReasons.organizationId,
      reason: churnReasons.reason,
      details: churnReasons.details,
      healthScoreAtChurn: churnReasons.healthScoreAtChurn,
      createdAt: churnReasons.createdAt,
    })
    .from(churnReasons)
    .orderBy(desc(churnReasons.createdAt))
    .limit(20);

  if (records.length === 0) return [];

  // Fetch org names
  const orgIds = records.map((r) => r.organizationId);
  const orgs = await db
    .select({ id: organizations.id, name: organizations.name, slug: organizations.slug })
    .from(organizations)
    .where(sql`${organizations.id} IN ${orgIds}`);

  const orgMap = new Map(orgs.map((o) => [o.id, { name: o.name, slug: o.slug }]));

  return records.map((r) => ({
    id: r.id,
    orgId: r.organizationId,
    orgName: orgMap.get(r.organizationId)?.name || "Unknown",
    slug: orgMap.get(r.organizationId)?.slug || "",
    reason: r.reason,
    details: r.details,
    healthScoreAtChurn: r.healthScoreAtChurn,
    createdAt: r.createdAt,
  }));
}

export async function logChurnReason(
  organizationId: string,
  reason: string,
  details?: string,
): Promise<void> {
  // Get current health score to snapshot
  const health = await getSingleCustomerHealth(organizationId);
  const healthScore = health?.breakdown.total ?? null;

  await db.insert(churnReasons).values({
    organizationId,
    reason: reason as "pricing" | "not_using" | "competitor" | "missing_features" | "support" | "other",
    details: details || null,
    healthScoreAtChurn: healthScore,
  });
}
