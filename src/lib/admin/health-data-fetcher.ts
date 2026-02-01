import { db } from "@/lib/db";
import { eq, sql, and, gte } from "drizzle-orm";
import {
  organizations,
  properties,
  contentSections,
  faqs,
  accessTokens,
  chatSessions,
  tickets,
  aiUsage,
  organizationMembers,
  users,
} from "@/lib/db/schema/main-app-tables";
import { TIER_LIMITS, getCurrentMonth } from "./constants";
import {
  calculateHealthScore,
  type CustomerHealthData,
  type OrgHealthInput,
} from "./health";

export async function getHealthDataForOrgs(orgIds: string[]): Promise<CustomerHealthData[]> {
  if (orgIds.length === 0) return [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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

    db
      .select({
        organizationId: properties.organizationId,
        propertyId: properties.id,
      })
      .from(properties)
      .where(sql`${properties.organizationId} IN ${orgIds}`),

    db
      .select({
        propertyId: faqs.propertyId,
        count: sql<number>`count(*)::int`,
      })
      .from(faqs)
      .innerJoin(properties, eq(faqs.propertyId, properties.id))
      .where(sql`${properties.organizationId} IN ${orgIds}`)
      .groupBy(faqs.propertyId),

    db
      .select({
        propertyId: contentSections.propertyId,
        count: sql<number>`count(*)::int`,
      })
      .from(contentSections)
      .innerJoin(properties, eq(contentSections.propertyId, properties.id))
      .where(sql`${properties.organizationId} IN ${orgIds}`)
      .groupBy(contentSections.propertyId),

    db
      .select({
        propertyId: accessTokens.propertyId,
        count: sql<number>`count(*)::int`,
      })
      .from(accessTokens)
      .innerJoin(properties, eq(accessTokens.propertyId, properties.id))
      .where(sql`${properties.organizationId} IN ${orgIds}`)
      .groupBy(accessTokens.propertyId),

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
        organizationId: properties.organizationId,
        lastStartedAt: sql<string>`max(${chatSessions.startedAt})`,
      })
      .from(chatSessions)
      .innerJoin(properties, eq(chatSessions.propertyId, properties.id))
      .where(sql`${properties.organizationId} IN ${orgIds}`)
      .groupBy(properties.organizationId),

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
