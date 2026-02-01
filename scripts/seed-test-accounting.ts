/**
 * Seed script: Creates 20 test organizations with mixed subscription data
 * for testing accounting features in the CRM.
 *
 * Usage: npm run seed:test
 *
 * All org names are prefixed with "TEST - " for easy identification.
 * Run `npm run seed:cleanup` to remove all seeded data.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, like } from "drizzle-orm";
import {
  organizations,
  users,
  organizationMembers,
  aiUsage,
  crmSubscriptions,
} from "../src/lib/db/schema/main-app-tables";
import { churnReasons } from "../src/lib/db/schema/tables";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tier = "ruby" | "sapphire" | "emerald" | "diamond";
type Status = "active" | "trialing" | "past_due" | "canceled" | "expired";
type BillingPeriod = "monthly" | "annual";
type ChurnReason =
  | "pricing"
  | "not_using"
  | "competitor"
  | "missing_features"
  | "support"
  | "other";

interface OrgConfig {
  name: string;
  tier: Tier;
  status: Status;
  billing: BillingPeriod;
  extraProps: number;
  extraUnits: number;
  crmAddon?: BillingPeriod;
  churn?: { reason: ChurnReason; details: string; healthScore: number };
  trialDaysAgo?: number;
  trialDaysLeft?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_PREFIX = "TEST - ";

const TIER_LIMITS: Record<Tier, number> = {
  ruby: 1_000,
  sapphire: 5_000,
  emerald: 20_000,
  diamond: 50_000,
};

const MONTHS = ["2025-12", "2026-01", "2026-02"];

// ---------------------------------------------------------------------------
// Organization Configs (20 total)
// ---------------------------------------------------------------------------

const ORG_CONFIGS: OrgConfig[] = [
  // --- Active (10) ---
  {
    name: "Sunset Resort",
    tier: "diamond",
    status: "active",
    billing: "annual",
    extraProps: 15,
    extraUnits: 30,
    crmAddon: "annual",
  },
  {
    name: "Mountain Lodge",
    tier: "emerald",
    status: "active",
    billing: "monthly",
    extraProps: 8,
    extraUnits: 20,
    crmAddon: "monthly",
  },
  {
    name: "Beachside Villas",
    tier: "emerald",
    status: "active",
    billing: "annual",
    extraProps: 12,
    extraUnits: 0,
  },
  {
    name: "City Center Hotel",
    tier: "sapphire",
    status: "active",
    billing: "monthly",
    extraProps: 5,
    extraUnits: 15,
    crmAddon: "monthly",
  },
  {
    name: "Harbor Inn",
    tier: "sapphire",
    status: "active",
    billing: "annual",
    extraProps: 0,
    extraUnits: 10,
  },
  {
    name: "Palm Springs Suites",
    tier: "diamond",
    status: "active",
    billing: "monthly",
    extraProps: 20,
    extraUnits: 50,
    crmAddon: "monthly",
  },
  {
    name: "Alpine Retreat",
    tier: "emerald",
    status: "active",
    billing: "monthly",
    extraProps: 0,
    extraUnits: 0,
    crmAddon: "annual",
  },
  {
    name: "Lakefront Cabins",
    tier: "sapphire",
    status: "active",
    billing: "annual",
    extraProps: 3,
    extraUnits: 8,
  },
  {
    name: "Downtown Lofts",
    tier: "ruby",
    status: "active",
    billing: "monthly",
    extraProps: 0,
    extraUnits: 0,
  },
  {
    name: "Seaside Cottage",
    tier: "ruby",
    status: "active",
    billing: "annual",
    extraProps: 0,
    extraUnits: 0,
  },
  // --- Trialing (4) ---
  {
    name: "Riverside B&B",
    tier: "sapphire",
    status: "trialing",
    billing: "monthly",
    extraProps: 0,
    extraUnits: 0,
    trialDaysAgo: 7,
    trialDaysLeft: 7,
  },
  {
    name: "Garden Hotel",
    tier: "emerald",
    status: "trialing",
    billing: "monthly",
    extraProps: 0,
    extraUnits: 0,
    trialDaysAgo: 10,
    trialDaysLeft: 4,
  },
  {
    name: "Hilltop Villas",
    tier: "ruby",
    status: "trialing",
    billing: "monthly",
    extraProps: 0,
    extraUnits: 0,
    trialDaysAgo: 3,
    trialDaysLeft: 11,
  },
  {
    name: "Royal Suites",
    tier: "diamond",
    status: "trialing",
    billing: "annual",
    extraProps: 0,
    extraUnits: 0,
    trialDaysAgo: 14,
    trialDaysLeft: 0,
  },
  // --- Past Due (2) ---
  {
    name: "Ocean Breeze",
    tier: "sapphire",
    status: "past_due",
    billing: "monthly",
    extraProps: 4,
    extraUnits: 12,
    crmAddon: "monthly",
  },
  {
    name: "Maple Heights",
    tier: "emerald",
    status: "past_due",
    billing: "annual",
    extraProps: 6,
    extraUnits: 0,
  },
  // --- Canceled (3) ---
  {
    name: "Silver Creek Lodge",
    tier: "sapphire",
    status: "canceled",
    billing: "monthly",
    extraProps: 0,
    extraUnits: 0,
    churn: {
      reason: "pricing",
      details: "Found the sapphire tier too expensive for their property count.",
      healthScore: 35,
    },
  },
  {
    name: "Coral Bay Resort",
    tier: "emerald",
    status: "canceled",
    billing: "annual",
    extraProps: 0,
    extraUnits: 0,
    churn: {
      reason: "competitor",
      details: "Switched to a competitor offering bundled PMS + guest messaging.",
      healthScore: 48,
    },
  },
  {
    name: "Pine Valley Inn",
    tier: "ruby",
    status: "canceled",
    billing: "monthly",
    extraProps: 0,
    extraUnits: 0,
    churn: {
      reason: "not_using",
      details: "Never completed onboarding. Only used the platform for 2 weeks.",
      healthScore: 22,
    },
  },
  // --- Expired (1) ---
  {
    name: "Desert Oasis",
    tier: "sapphire",
    status: "expired",
    billing: "monthly",
    extraProps: 0,
    extraUnits: 0,
    churn: {
      reason: "not_using",
      details: "Trial expired without converting. Low engagement during trial.",
      healthScore: 15,
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
  return (TEST_PREFIX + name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `test-${slug}@test.askconcierge.ai`;
}

function daysMs(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

/** Returns a usage multiplier (0..1) based on status and month recency. */
function usageMultiplier(status: Status, monthIndex: number): number {
  // monthIndex: 0 = oldest (2025-12), 2 = newest (2026-02)
  switch (status) {
    case "active":
      // Active orgs: 40-85% usage, trending upward
      return 0.4 + monthIndex * 0.15 + Math.random() * 0.15;
    case "trialing":
      // Trial orgs: light usage 5-20%
      return 0.05 + monthIndex * 0.05 + Math.random() * 0.1;
    case "past_due":
      // Past due: moderate usage, declining
      return 0.5 - monthIndex * 0.1 + Math.random() * 0.1;
    case "canceled":
      // Canceled: had some usage, then stopped
      return monthIndex < 2 ? 0.2 + Math.random() * 0.15 : 0;
    case "expired":
      // Expired trial: very light, then nothing
      return monthIndex === 0 ? 0.03 + Math.random() * 0.05 : 0;
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Make sure .env.local is loaded.");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("Seeding 20 test accounting organizations...\n");

  // Check for existing test data
  const existing = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(like(organizations.name, "TEST - %"));

  if (existing.length > 0) {
    console.error(
      `Found ${existing.length} existing TEST organizations. Run "npm run seed:cleanup" first.`
    );
    process.exit(1);
  }

  const summary = {
    orgs: 0,
    users: 0,
    members: 0,
    aiUsageRecords: 0,
    crmSubs: 0,
    churnRecords: 0,
  };

  for (const config of ORG_CONFIGS) {
    const fullName = TEST_PREFIX + config.name;
    const slug = toSlug(config.name);
    const email = toEmail(config.name);

    // 1. Insert user
    const [user] = await db
      .insert(users)
      .values({
        name: config.name + " Owner",
        email,
      })
      .returning();
    summary.users++;

    // 2. Insert organization
    const orgValues: Record<string, unknown> = {
      name: fullName,
      slug,
      type: "hotel",
      pricingTier: config.tier,
      subscriptionStatus: config.status,
      billingPeriod: config.billing,
      extraPropertiesCount: config.extraProps,
      extraUnitsCount: config.extraUnits,
      stripeCustomerId: `cus_test_${slug}`,
    };

    // Add stripe subscription ID for non-trialing orgs
    if (config.status !== "trialing") {
      orgValues.stripeSubscriptionId = `sub_test_${slug}`;
    }

    // Trial dates
    if (config.status === "trialing") {
      orgValues.trialStartedAt = new Date(
        Date.now() - daysMs(config.trialDaysAgo ?? 7)
      );
      orgValues.trialEndsAt = new Date(
        Date.now() + daysMs(config.trialDaysLeft ?? 7)
      );
    }

    // Onboarding date for non-trialing orgs
    if (config.status !== "trialing") {
      orgValues.onboardingCompletedAt = new Date(
        Date.now() - daysMs(30 + Math.floor(Math.random() * 150))
      );
    }

    const [org] = await db
      .insert(organizations)
      .values(orgValues as typeof organizations.$inferInsert)
      .returning();
    summary.orgs++;

    // 3. Insert organization member
    await db.insert(organizationMembers).values({
      organizationId: org.id,
      userId: user.id,
      role: "owner",
    });
    summary.members++;

    // 4. CRM subscription
    if (config.crmAddon) {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd =
        config.crmAddon === "monthly"
          ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
          : new Date(now.getFullYear() + 1, now.getMonth(), 1);

      await db.insert(crmSubscriptions).values({
        organizationId: org.id,
        status: "active",
        stripeSubscriptionId: `sub_crm_test_${slug}`,
        stripePriceId: `price_crm_${config.crmAddon}`,
        billingPeriod: config.crmAddon,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });
      summary.crmSubs++;
    }

    // 5. AI usage (3 months)
    const tierLimit = TIER_LIMITS[config.tier];

    for (let i = 0; i < MONTHS.length; i++) {
      const multiplier = usageMultiplier(config.status, i);
      const totalMessages = Math.floor(tierLimit * multiplier);
      const cached = Math.floor(totalMessages * 0.15);
      const faqMatched = Math.floor(totalMessages * 0.35);
      const directLookup = Math.floor(totalMessages * 0.1);

      await db.insert(aiUsage).values({
        organizationId: org.id,
        month: MONTHS[i],
        messagesUsed: totalMessages,
        messagesCached: cached,
        messagesFaqMatched: faqMatched,
        messagesDirectLookup: directLookup,
        tokensInput: totalMessages * 150,
        tokensOutput: totalMessages * 80,
      });
      summary.aiUsageRecords++;
    }

    // 6. Churn reason
    if (config.churn) {
      await db.insert(churnReasons).values({
        organizationId: org.id,
        reason: config.churn.reason,
        details: config.churn.details,
        healthScoreAtChurn: config.churn.healthScore,
      });
      summary.churnRecords++;
    }

    const statusTag =
      config.status === "active"
        ? "active"
        : config.status === "trialing"
          ? "trial"
          : config.status;
    const extras = [];
    if (config.extraProps > 0) extras.push(`+${config.extraProps} props`);
    if (config.extraUnits > 0) extras.push(`+${config.extraUnits} units`);
    if (config.crmAddon) extras.push(`CRM(${config.crmAddon})`);
    if (config.churn) extras.push(`churned:${config.churn.reason}`);

    console.log(
      `  [${config.tier.padEnd(8)}] ${fullName.padEnd(32)} ${statusTag.padEnd(10)} ${config.billing.padEnd(8)} ${extras.join(", ")}`
    );
  }

  console.log("\n--- Summary ---");
  console.log(`  Organizations:  ${summary.orgs}`);
  console.log(`  Users:          ${summary.users}`);
  console.log(`  Members:        ${summary.members}`);
  console.log(`  AI Usage rows:  ${summary.aiUsageRecords}`);
  console.log(`  CRM Subs:       ${summary.crmSubs}`);
  console.log(`  Churn Records:  ${summary.churnRecords}`);
  console.log("\nDone! Test data is ready.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
