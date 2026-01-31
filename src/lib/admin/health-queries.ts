import { db } from "@/lib/db";
import { eq, sql, and, gte, desc } from "drizzle-orm";
import {
  organizations,
  properties,
  units,
  aiUsage,
  chatSessions,
  contentSections,
  faqs,
  accessTokens,
  tickets,
  organizationMembers,
  users,
} from "@/lib/db/schema/main-app-tables";
import { TIER_LIMITS } from "./constants";
import {
  calculateHealthScore,
  type CustomerHealthData,
  type HealthDashboardStats,
  type HealthScoreBreakdown,
  type OrgHealthInput,
} from "./health";

// ============================================
// Batch data fetching for health calculations
// ============================================

interface OrgRawData {
  id: string;
  name: string;
  slug: string;
  pricingTier: string | null;
  subscriptionStatus: string | null;
  owner: { email: string; name: string | null } | null;
  propertyCount: number;
  usagePercent: number;
  properties: Array<{ hasFaqs: boolean; hasContent: boolean; hasTokens: boolean }>;
  chatSessionsLast30d: number;
  openTickets: number;
  openHighPriorityTickets: number;
  totalTickets: number;
  resolvedTickets: number;
  daysSinceLastChat: number | null;
}

export async function getHealthDataForOrgs(orgIds: string[]): Promise<CustomerHealthData[]> {
  if (orgIds.length === 0) return [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch all data in parallel
  const [
    orgList,
    propList,
    faqCounts,
    contentCounts,
    tokenCounts,
    sessionCounts,
    lastSessions,
    ticketData,
    usageData,
    ownerData,
  ] = await Promise.all([
    // 1. Basic org info
    db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        pricingTier: organizations.pricingTier,
        subscriptionStatus: organizations.subscriptionStatus,
      })
      .from(organizations)
      .where(sql`${organizations.id} IN ${orgIds}`),

    // 2. Properties per org
    db
      .select({
        organizationId: properties.organizationId,
        propertyId: properties.id,
      })
      .from(properties)
      .where(sql`${properties.organizationId} IN ${orgIds}`),

    // 3. FAQ counts per property
    db
      .select({
        propertyId: faqs.propertyId,
        count: sql<number>`count(*)::int`,
      })
      .from(faqs)
      .innerJoin(properties, eq(faqs.propertyId, properties.id))
      .where(sql`${properties.organizationId} IN ${orgIds}`)
      .groupBy(faqs.propertyId),

    // 4. Content section counts per property
    db
      .select({
        propertyId: contentSections.propertyId,
        count: sql<number>`count(*)::int`,
      })
      .from(contentSections)
      .innerJoin(properties, eq(contentSections.propertyId, properties.id))
      .where(sql`${properties.organizationId} IN ${orgIds}`)
      .groupBy(contentSections.propertyId),

    // 5. Access token counts per property
    db
      .select({
        propertyId: accessTokens.propertyId,
        count: sql<number>`count(*)::int`,
      })
      .from(accessTokens)
      .innerJoin(properties, eq(accessTokens.propertyId, properties.id))
      .where(sql`${properties.organizationId} IN ${orgIds}`)
      .groupBy(accessTokens.propertyId),

    // 6. Chat sessions in last 30d per org (via property join)
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

    // 7. Last chat session per org
    db
      .select({
        organizationId: properties.organizationId,
        lastStartedAt: sql<string>`max(${chatSessions.startedAt})`,
      })
      .from(chatSessions)
      .innerJoin(properties, eq(chatSessions.propertyId, properties.id))
      .where(sql`${properties.organizationId} IN ${orgIds}`)
      .groupBy(properties.organizationId),

    // 8. Ticket data per org
    db
      .select({
        organizationId: properties.organizationId,
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where ${tickets.status} IN ('open', 'in_progress'))::int`,
        openHighPriority: sql<number>`count(*) filter (where ${tickets.status} IN ('open', 'in_progress') and ${tickets.priority} IN ('high', 'urgent'))::int`,
        resolved: sql<number>`count(*) filter (where ${tickets.status} IN ('resolved', 'closed'))::int`,
      })
      .from(tickets)
      .innerJoin(properties, eq(tickets.propertyId, properties.id))
      .where(sql`${properties.organizationId} IN ${orgIds}`)
      .groupBy(properties.organizationId),

    // 9. Current month AI usage per org
    db
      .select({
        organizationId: aiUsage.organizationId,
        messagesUsed: aiUsage.messagesUsed,
      })
      .from(aiUsage)
      .where(
        and(
          sql`${aiUsage.organizationId} IN ${orgIds}`,
          eq(aiUsage.month, getCurrentMonth())
        )
      ),

    // 10. Owners
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

  // Build lookup maps
  const faqMap = new Map(faqCounts.map((f) => [f.propertyId, f.count]));
  const contentMap = new Map(contentCounts.map((c) => [c.propertyId, c.count]));
  const tokenMap = new Map(tokenCounts.map((t) => [t.propertyId, t.count]));
  const sessionMap = new Map(sessionCounts.map((s) => [s.organizationId, s.count]));
  const lastSessionMap = new Map(lastSessions.map((s) => [s.organizationId, s.lastStartedAt]));
  const ticketMap = new Map(ticketData.map((t) => [t.organizationId, t]));
  const usageMap = new Map(usageData.map((u) => [u.organizationId, u.messagesUsed || 0]));
  const ownerMap = new Map(ownerData.map((o) => [o.organizationId, { email: o.email, name: o.name }]));

  // Group properties by org
  const orgPropsMap = new Map<string, string[]>();
  for (const p of propList) {
    const existing = orgPropsMap.get(p.organizationId) || [];
    existing.push(p.propertyId);
    orgPropsMap.set(p.organizationId, existing);
  }

  // Calculate health for each org
  return orgList.map((org) => {
    const orgProps = orgPropsMap.get(org.id) || [];
    const tier = org.pricingTier || "ruby";
    const tierLimit = TIER_LIMITS[tier]?.messages || 1000;
    const messagesUsed = usageMap.get(org.id) || 0;
    const usagePercent = tierLimit > 0 ? (messagesUsed / tierLimit) * 100 : 0;

    const propertyData = orgProps.map((propId) => ({
      hasFaqs: (faqMap.get(propId) || 0) > 0,
      hasContent: (contentMap.get(propId) || 0) > 0,
      hasTokens: (tokenMap.get(propId) || 0) > 0,
    }));

    const chatSessionsLast30d = sessionMap.get(org.id) || 0;
    const lastChatStr = lastSessionMap.get(org.id);
    const daysSinceLastChat = lastChatStr
      ? Math.floor((Date.now() - new Date(lastChatStr).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const ticket = ticketMap.get(org.id);

    const input: OrgHealthInput = {
      usagePercent,
      properties: propertyData,
      chatSessionsLast30d,
      openTickets: ticket?.open || 0,
      openHighPriorityTickets: ticket?.openHighPriority || 0,
      totalTickets: ticket?.total || 0,
      resolvedTickets: ticket?.resolved || 0,
      daysSinceLastChat,
    };

    const breakdown = calculateHealthScore(input);

    return {
      orgId: org.id,
      orgName: org.name,
      slug: org.slug,
      pricingTier: org.pricingTier,
      subscriptionStatus: org.subscriptionStatus,
      owner: ownerMap.get(org.id) || null,
      propertyCount: orgProps.length,
      breakdown,
      usagePercent: Math.round(usagePercent),
      chatSessionsLast30d,
      daysSinceLastChat,
    };
  });
}

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

// ============================================
// Trial-specific queries (reused by Feature 2)
// ============================================

export interface TrialOnboardingData {
  orgId: string;
  orgName: string;
  slug: string;
  pricingTier: string | null;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  daysRemaining: number;
  daysElapsed: number;
  onboardingCompletedAt: Date | null;
  milestones: {
    hasProperty: boolean;
    hasFaq: boolean;
    hasContentSection: boolean;
    hasFirstChat: boolean;
    onboardingCompleted: boolean;
  };
  milestonesCompleted: number;
  lastActivityDaysAgo: number | null;
  owner: { email: string; name: string | null } | null;
}

export async function getTrialOnboardingData(): Promise<TrialOnboardingData[]> {
  const trialOrgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      pricingTier: organizations.pricingTier,
      trialStartedAt: organizations.trialStartedAt,
      trialEndsAt: organizations.trialEndsAt,
      onboardingCompletedAt: organizations.onboardingCompletedAt,
    })
    .from(organizations)
    .where(eq(organizations.subscriptionStatus, "trialing"));

  if (trialOrgs.length === 0) return [];

  const orgIds = trialOrgs.map((o) => o.id);

  const [propCounts, faqOrgs, contentOrgs, chatOrgs, ownerData] = await Promise.all([
    db
      .select({
        organizationId: properties.organizationId,
        count: sql<number>`count(*)::int`,
      })
      .from(properties)
      .where(sql`${properties.organizationId} IN ${orgIds}`)
      .groupBy(properties.organizationId),

    db
      .select({ organizationId: properties.organizationId })
      .from(faqs)
      .innerJoin(properties, eq(faqs.propertyId, properties.id))
      .where(sql`${properties.organizationId} IN ${orgIds}`)
      .groupBy(properties.organizationId),

    db
      .select({ organizationId: properties.organizationId })
      .from(contentSections)
      .innerJoin(properties, eq(contentSections.propertyId, properties.id))
      .where(sql`${properties.organizationId} IN ${orgIds}`)
      .groupBy(properties.organizationId),

    db
      .select({
        organizationId: properties.organizationId,
        lastChat: sql<string>`max(${chatSessions.startedAt})`,
      })
      .from(chatSessions)
      .innerJoin(properties, eq(chatSessions.propertyId, properties.id))
      .where(sql`${properties.organizationId} IN ${orgIds}`)
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
  const faqSet = new Set(faqOrgs.map((f) => f.organizationId));
  const contentSet = new Set(contentOrgs.map((c) => c.organizationId));
  const chatMap = new Map(chatOrgs.map((c) => [c.organizationId, c.lastChat]));
  const ownerMap = new Map(ownerData.map((o) => [o.organizationId, { email: o.email, name: o.name }]));

  const now = Date.now();

  return trialOrgs.map((org) => {
    const hasProperty = (propMap.get(org.id) || 0) > 0;
    const hasFaq = faqSet.has(org.id);
    const hasContentSection = contentSet.has(org.id);
    const lastChatStr = chatMap.get(org.id);
    const hasFirstChat = !!lastChatStr;
    const onboardingCompleted = !!org.onboardingCompletedAt;

    const milestones = { hasProperty, hasFaq, hasContentSection, hasFirstChat, onboardingCompleted };
    const milestonesCompleted = Object.values(milestones).filter(Boolean).length;

    const trialEnd = org.trialEndsAt ? new Date(org.trialEndsAt).getTime() : now;
    const trialStart = org.trialStartedAt ? new Date(org.trialStartedAt).getTime() : now;
    const daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.floor((now - trialStart) / (1000 * 60 * 60 * 24)));

    const lastActivityDaysAgo = lastChatStr
      ? Math.floor((now - new Date(lastChatStr).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      orgId: org.id,
      orgName: org.name,
      slug: org.slug,
      pricingTier: org.pricingTier,
      trialStartedAt: org.trialStartedAt,
      trialEndsAt: org.trialEndsAt,
      daysRemaining,
      daysElapsed,
      onboardingCompletedAt: org.onboardingCompletedAt,
      milestones,
      milestonesCompleted,
      lastActivityDaysAgo,
      owner: ownerMap.get(org.id) || null,
    };
  });
}

// ============================================
// Upgrade opportunity detection (Feature 4)
// ============================================

export interface UpgradeOpportunity {
  orgId: string;
  orgName: string;
  slug: string;
  currentTier: string;
  subscriptionStatus: string | null;
  owner: { email: string; name: string | null } | null;
  triggers: UpgradeTrigger[];
  suggestedTier: string;
  potentialMrrIncrease: number;
}

export interface UpgradeTrigger {
  type: "usage_high" | "property_limit" | "unit_limit" | "high_engagement_ruby" | "missing_features";
  description: string;
  currentValue: number;
  limitValue: number;
}

// ============================================
// Helpers
// ============================================

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
