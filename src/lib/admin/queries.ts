import { db } from "@/lib/db";
import { eq, sql, desc, asc, and, ilike, gte, lte } from "drizzle-orm";
import {
  organizations,
  users,
  organizationMembers,
  properties,
  units,
  aiUsage,
  crmSubscriptions,
} from "@/lib/db/schema/main-app-tables";
import type { AdminOrgFilters } from "./types";

// Re-export for backwards compatibility
export { getAdminStats } from "./stats-queries";

export async function listOrganizations(filters: AdminOrgFilters) {
  const {
    search,
    tier,
    status,
    sort = "createdAt",
    order = "desc",
    page = 1,
    limit = 20,
    dateFrom,
    dateTo,
    hasCrmAddon,
  } = filters;

  const conditions = [];
  if (search) {
    conditions.push(ilike(organizations.name, `%${search}%`));
  }
  if (tier) {
    conditions.push(eq(organizations.pricingTier, tier));
  }
  if (status) {
    conditions.push(eq(organizations.subscriptionStatus, status));
  }
  if (dateFrom) {
    conditions.push(gte(organizations.createdAt, new Date(dateFrom)));
  }
  if (dateTo) {
    conditions.push(lte(organizations.createdAt, new Date(dateTo)));
  }
  if (hasCrmAddon) {
    conditions.push(
      sql`${organizations.id} IN (SELECT ${crmSubscriptions.organizationId} FROM ${crmSubscriptions} WHERE ${crmSubscriptions.status} = 'active')`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Get sort column
  const sortColumn = sort === "name" ? organizations.name
    : sort === "tier" ? organizations.pricingTier
    : sort === "status" ? organizations.subscriptionStatus
    : organizations.createdAt;
  const orderFn = order === "asc" ? asc : desc;

  // Count total
  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(organizations)
    .where(where);

  // Fetch orgs
  const orgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      type: organizations.type,
      pricingTier: organizations.pricingTier,
      subscriptionStatus: organizations.subscriptionStatus,
      billingPeriod: organizations.billingPeriod,
      stripeCustomerId: organizations.stripeCustomerId,
      stripeSubscriptionId: organizations.stripeSubscriptionId,
      trialStartedAt: organizations.trialStartedAt,
      trialEndsAt: organizations.trialEndsAt,
      trialExtendedCount: organizations.trialExtendedCount,
      extraPropertiesCount: organizations.extraPropertiesCount,
      extraUnitsCount: organizations.extraUnitsCount,
      phoneNumber: organizations.phoneNumber,
      defaultLanguage: organizations.defaultLanguage,
      onboardingCompletedAt: organizations.onboardingCompletedAt,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .where(where)
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset((page - 1) * limit);

  // Batch fetch property counts
  const orgIds = orgs.map((o) => o.id);
  if (orgIds.length === 0) {
    return { organizations: [], total, page, limit };
  }

  const [propertyCounts, unitCounts, memberCounts, owners, activeCrmSubs] = await Promise.all([
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
        organizationId: organizationMembers.organizationId,
        count: sql<number>`count(*)::int`,
      })
      .from(organizationMembers)
      .where(sql`${organizationMembers.organizationId} IN ${orgIds}`)
      .groupBy(organizationMembers.organizationId),

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

    db
      .select({ organizationId: crmSubscriptions.organizationId })
      .from(crmSubscriptions)
      .where(
        and(
          eq(crmSubscriptions.status, "active"),
          sql`${crmSubscriptions.organizationId} IN ${orgIds}`
        )
      ),
  ]);

  const crmAddonSet = new Set(activeCrmSubs.map((r) => r.organizationId));
  const propMap = new Map(propertyCounts.map((p) => [p.organizationId, p.count]));
  const unitMap = new Map(unitCounts.map((u) => [u.organizationId, u.count]));
  const memberMap = new Map(memberCounts.map((m) => [m.organizationId, m.count]));
  const ownerMap = new Map(owners.map((o) => [o.organizationId, { email: o.email, name: o.name }]));

  const result = orgs.map((org) => ({
    ...org,
    propertyCount: propMap.get(org.id) || 0,
    unitCount: unitMap.get(org.id) || 0,
    memberCount: memberMap.get(org.id) || 0,
    owner: ownerMap.get(org.id) || null,
    hasCrmAddon: crmAddonSet.has(org.id),
  }));

  return { organizations: result, total, page, limit };
}

export async function getOrganizationDetail(id: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);

  if (!org) return null;

  const [propCountResult, unitCountResult, memberCountResult, ownerResult, crmSubResult] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(properties)
        .where(eq(properties.organizationId, id)),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(units)
        .innerJoin(properties, eq(units.propertyId, properties.id))
        .where(eq(properties.organizationId, id)),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, id)),

      db
        .select({ email: users.email, name: users.name })
        .from(organizationMembers)
        .innerJoin(users, eq(users.id, organizationMembers.userId))
        .where(
          and(
            eq(organizationMembers.organizationId, id),
            eq(organizationMembers.role, "owner")
          )
        )
        .limit(1),

      db
        .select({
          status: crmSubscriptions.status,
          billingPeriod: crmSubscriptions.billingPeriod,
          currentPeriodEnd: crmSubscriptions.currentPeriodEnd,
          cancelAtPeriodEnd: crmSubscriptions.cancelAtPeriodEnd,
        })
        .from(crmSubscriptions)
        .where(
          and(
            eq(crmSubscriptions.organizationId, id),
            eq(crmSubscriptions.status, "active")
          )
        )
        .limit(1),
    ]);

  const [propCount] = propCountResult;
  const [unitCount] = unitCountResult;
  const [memberCount] = memberCountResult;
  const [owner] = ownerResult;
  const [crmSub] = crmSubResult;

  return {
    ...org,
    propertyCount: propCount?.count || 0,
    unitCount: unitCount?.count || 0,
    memberCount: memberCount?.count || 0,
    owner: owner || null,
    hasCrmAddon: !!crmSub,
    crmSubscription: crmSub
      ? {
          status: crmSub.status,
          billingPeriod: crmSub.billingPeriod || "monthly",
          currentPeriodEnd: crmSub.currentPeriodEnd,
          cancelAtPeriodEnd: crmSub.cancelAtPeriodEnd ?? false,
        }
      : null,
  };
}

export async function getOrganizationMembers(orgId: string) {
  return db
    .select({
      id: organizationMembers.id,
      userId: organizationMembers.userId,
      role: organizationMembers.role,
      jobTitle: organizationMembers.jobTitle,
      createdAt: organizationMembers.createdAt,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(eq(organizationMembers.organizationId, orgId));
}

export async function getOrganizationUsage(orgId: string) {
  return db
    .select({
      month: aiUsage.month,
      messagesUsed: aiUsage.messagesUsed,
      messagesCached: aiUsage.messagesCached,
      messagesFaqMatched: aiUsage.messagesFaqMatched,
      messagesDirectLookup: aiUsage.messagesDirectLookup,
      tokensInput: aiUsage.tokensInput,
      tokensOutput: aiUsage.tokensOutput,
    })
    .from(aiUsage)
    .where(eq(aiUsage.organizationId, orgId))
    .orderBy(desc(aiUsage.month));
}
