import { db } from "@/lib/db";
import { eq, sql, and } from "drizzle-orm";
import {
  organizations,
  properties,
  contentSections,
  faqs,
  chatSessions,
  organizationMembers,
  users,
} from "@/lib/db/schema/main-app-tables";

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
