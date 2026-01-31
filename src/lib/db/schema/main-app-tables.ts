/**
 * Read-only table references from the main AskConciergeAI app.
 * These tables already exist in the shared Neon database.
 * DO NOT run db:push or migrations against these — they are managed by the main app.
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ============================================
// ORGANIZATIONS (Main app tenants)
// ============================================
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  pricingTier: varchar("pricing_tier", { length: 50 }).default("ruby"),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#2563eb"),
  landingPageEnabled: boolean("landing_page_enabled").default(false),
  customDomain: varchar("custom_domain", { length: 255 }),
  trialStartedAt: timestamp("trial_started_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  trialExtendedCount: integer("trial_extended_count").default(0),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("trialing"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  extraPropertiesCount: integer("extra_properties_count").default(0),
  extraUnitsCount: integer("extra_units_count").default(0),
  billingPeriod: varchar("billing_period", { length: 20 }).default("monthly"),
  defaultLanguage: varchar("default_language", { length: 5 }).default("en"),
  phoneNumber: varchar("phone_number", { length: 50 }),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// USERS
// ============================================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique().notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// ORGANIZATION MEMBERS
// ============================================
export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: varchar("role", { length: 50 }).notNull().default("member"),
    jobTitle: varchar("job_title", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("org_member_unique").on(table.organizationId, table.userId),
  ]
);

// ============================================
// PROPERTIES
// ============================================
export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    propertyType: varchar("property_type", { length: 50 }),
    city: varchar("city", { length: 100 }),
    country: varchar("country", { length: 100 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("properties_org_idx").on(table.organizationId)]
);

// ============================================
// UNITS
// ============================================
export const units = pgTable(
  "units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    unitType: varchar("unit_type", { length: 50 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("units_property_idx").on(table.propertyId)]
);

// ============================================
// AI USAGE
// ============================================
export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  messagesUsed: integer("messages_used").default(0),
  messagesCached: integer("messages_cached").default(0),
  messagesFaqMatched: integer("messages_faq_matched").default(0),
  messagesDirectLookup: integer("messages_direct_lookup").default(0),
  tokensInput: integer("tokens_input").default(0),
  tokensOutput: integer("tokens_output").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// CRM SUBSCRIPTIONS (Add-on tracking)
// ============================================
export const crmSubscriptions = pgTable("crm_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  billingPeriod: varchar("billing_period", { length: 20 }).default("monthly"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
