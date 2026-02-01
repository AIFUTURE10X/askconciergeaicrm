import { db } from "@/lib/db";
import { eq, sql, and, gte } from "drizzle-orm";
import {
  organizations,
  properties,
  units,
  aiUsage,
  chatSessions,
  organizationMembers,
  users,
} from "@/lib/db/schema/main-app-tables";
import { TIER_LIMITS, TIER_PRICING, getCurrentMonth } from "./constants";

// ============================================
// Types
// ============================================

export interface UpgradeTrigger {
  type: "usage_high" | "property_limit" | "unit_limit" | "high_engagement_ruby" | "missing_features";
  description: string;
  currentValue: number;
  limitValue: number;
}

export interface UpgradeOpportunity {
  orgId: string;
  orgName: string;
  slug: string;
  currentTier: string;
  subscriptionStatus: string | null;
  billingPeriod: string | null;
  owner: { email: string; name: string | null } | null;
  triggers: UpgradeTrigger[];
  suggestedTier: string;
  potentialMrrIncrease: number;
}

export interface UpgradeStats {
  totalOpportunities: number;
  potentialMrrIncrease: number;
  triggerBreakdown: Array<{ type: string; count: number }>;
}

// ============================================
// Tier ordering for upgrade suggestions
// ============================================

const TIER_ORDER = ["ruby", "sapphire", "emerald", "diamond"];

function getNextTier(current: string): string {
  const idx = TIER_ORDER.indexOf(current);
  if (idx === -1 || idx >= TIER_ORDER.length - 1) return current;
  return TIER_ORDER[idx + 1];
}

function getMrrIncrease(currentTier: string, suggestedTier: string, billingPeriod: string | null): number {
  const currentPrice = TIER_PRICING[currentTier];
  const suggestedPrice = TIER_PRICING[suggestedTier];
  if (!currentPrice || !suggestedPrice) return 0;

  const isAnnual = billingPeriod === "annual";
  const currentMrr = isAnnual ? currentPrice.annual / 12 : currentPrice.monthly;
  const suggestedMrr = isAnnual ? suggestedPrice.annual / 12 : suggestedPrice.monthly;
  return Math.round((suggestedMrr - currentMrr) * 100) / 100;
}

// ============================================
// Main query
// ============================================

export async function getUpgradeOpportunities(): Promise<{
  opportunities: UpgradeOpportunity[];
  stats: UpgradeStats;
}> {
  const currentMonth = getCurrentMonth();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get all active/trialing orgs
  const activeOrgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      pricingTier: organizations.pricingTier,
      subscriptionStatus: organizations.subscriptionStatus,
      billingPeriod: organizations.billingPeriod,
    })
    .from(organizations)
    .where(sql`${organizations.subscriptionStatus} IN ('active', 'trialing')`);

  if (activeOrgs.length === 0) {
    return { opportunities: [], stats: { totalOpportunities: 0, potentialMrrIncrease: 0, triggerBreakdown: [] } };
  }

  const orgIds = activeOrgs.map((o) => o.id);

  // Fetch all needed data in parallel
  const [propCounts, unitCounts, usageData, sessionCounts, ownerData] = await Promise.all([
    db
      .select({
        organizationId: properties.organizationId,
        count: sql<number>`count(*)::int`,
      })
      .from(properties)
      .where(sql`${properties.organizationId} IN ${orgIds}`)
      .groupBy(properties.organizationId),

    db
      .select({
        organizationId: properties.organizationId,
        count: sql<number>`count(*)::int`,
      })
      .from(units)
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(sql`${properties.organizationId} IN ${orgIds}`)
      .groupBy(properties.organizationId),

    db
      .select({
        organizationId: aiUsage.organizationId,
        messagesUsed: aiUsage.messagesUsed,
      })
      .from(aiUsage)
      .where(
        and(
          sql`${aiUsage.organizationId} IN ${orgIds}`,
          eq(aiUsage.month, currentMonth)
        )
      ),

    db
      .select({
        organizationId: properties.organizationId,
        count: sql<number>`count(*)::int`,
      })
      .from(chatSessions)
      .innerJoin(properties, eq(chatSessions.propertyId, properties.id))
      .where(
        and(
          sql`${properties.organizationId} IN ${orgIds}`,
          gte(chatSessions.startedAt, thirtyDaysAgo)
        )
      )
      .groupBy(properties.organizationId),

    db
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
      ),
  ]);

  const propMap = new Map(propCounts.map((p) => [p.organizationId, p.count]));
  const unitMap = new Map(unitCounts.map((u) => [u.organizationId, u.count]));
  const usageMap = new Map(usageData.map((u) => [u.organizationId, u.messagesUsed || 0]));
  const sessionMap = new Map(sessionCounts.map((s) => [s.organizationId, s.count]));
  const ownerMap = new Map(ownerData.map((o) => [o.organizationId, { email: o.email, name: o.name }]));

  const opportunities: UpgradeOpportunity[] = [];

  for (const org of activeOrgs) {
    const tier = org.pricingTier || "ruby";
    const limits = TIER_LIMITS[tier];
    if (!limits) continue;

    const triggers: UpgradeTrigger[] = [];
    const propCount = propMap.get(org.id) || 0;
    const unitCount = unitMap.get(org.id) || 0;
    const messagesUsed = usageMap.get(org.id) || 0;
    const sessions30d = sessionMap.get(org.id) || 0;
    const usagePercent = limits.messages > 0 ? (messagesUsed / limits.messages) * 100 : 0;

    // Check triggers
    if (usagePercent >= 80) {
      triggers.push({
        type: "usage_high",
        description: `Using ${Math.round(usagePercent)}% of AI message limit`,
        currentValue: messagesUsed,
        limitValue: limits.messages,
      });
    }

    if (propCount >= limits.properties) {
      triggers.push({
        type: "property_limit",
        description: `At property limit (${propCount}/${limits.properties})`,
        currentValue: propCount,
        limitValue: limits.properties,
      });
    }

    if (unitCount >= limits.units) {
      triggers.push({
        type: "unit_limit",
        description: `At unit limit (${unitCount}/${limits.units})`,
        currentValue: unitCount,
        limitValue: limits.units,
      });
    }

    if (tier === "ruby" && sessions30d >= 10) {
      triggers.push({
        type: "high_engagement_ruby",
        description: `High engagement Ruby user (${sessions30d} sessions/month)`,
        currentValue: sessions30d,
        limitValue: 10,
      });
    }

    if (triggers.length === 0) continue;

    const suggestedTier = getNextTier(tier);
    const potentialMrrIncrease = getMrrIncrease(tier, suggestedTier, org.billingPeriod);

    opportunities.push({
      orgId: org.id,
      orgName: org.name,
      slug: org.slug,
      currentTier: tier,
      subscriptionStatus: org.subscriptionStatus,
      billingPeriod: org.billingPeriod,
      owner: ownerMap.get(org.id) || null,
      triggers,
      suggestedTier,
      potentialMrrIncrease,
    });
  }

  // Sort by potential MRR increase descending
  opportunities.sort((a, b) => b.potentialMrrIncrease - a.potentialMrrIncrease);

  // Compute stats
  const triggerCounts: Record<string, number> = {};
  for (const opp of opportunities) {
    for (const t of opp.triggers) {
      triggerCounts[t.type] = (triggerCounts[t.type] || 0) + 1;
    }
  }

  const stats: UpgradeStats = {
    totalOpportunities: opportunities.length,
    potentialMrrIncrease: Math.round(opportunities.reduce((sum, o) => sum + o.potentialMrrIncrease, 0)),
    triggerBreakdown: Object.entries(triggerCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
  };

  return { opportunities, stats };
}

