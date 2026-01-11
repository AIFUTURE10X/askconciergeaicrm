import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// CONTACTS (Companies or Individuals)
// ============================================
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    company: varchar("company", { length: 255 }),
    title: varchar("title", { length: 100 }), // "Owner", "GM", "Revenue Manager"
    propertyType: varchar("property_type", { length: 50 }), // "hotel", "vacation_rental", "property_manager"
    website: text("website"),
    linkedinUrl: text("linkedin_url"),
    notes: text("notes"),
    source: varchar("source", { length: 50 }), // "cold_outreach", "inbound", "referral", "linkedin"
    tags: jsonb("tags").$type<string[]>().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("contacts_email_idx").on(table.email),
    index("contacts_company_idx").on(table.company),
    index("contacts_created_idx").on(table.createdAt),
  ]
);

// ============================================
// DEALS (Pipeline)
// ============================================
export const deals = pgTable(
  "deals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "cascade",
    }),
    title: varchar("title", { length: 255 }).notNull(), // "Sunset Resort - Emerald Plan"

    // Pipeline stages
    stage: varchar("stage", { length: 50 }).notNull().default("lead"),

    // Deal value tracking
    tier: varchar("tier", { length: 50 }), // "ruby", "sapphire", "emerald", "diamond"
    value: decimal("value", { precision: 10, scale: 2 }), // Monthly or annual value
    billingPeriod: varchar("billing_period", { length: 20 }).default("monthly"),
    propertyCount: integer("property_count").default(1), // Number of properties in deal

    // Probability & timing
    probability: integer("probability").default(10), // 0-100%
    expectedCloseDate: timestamp("expected_close_date"),

    // Outcome tracking
    closedAt: timestamp("closed_at"),
    lostReason: varchar("lost_reason", { length: 255 }),

    notes: text("notes"),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("deals_contact_idx").on(table.contactId),
    index("deals_stage_idx").on(table.stage),
    index("deals_expected_close_idx").on(table.expectedCloseDate),
    index("deals_created_idx").on(table.createdAt),
  ]
);

// ============================================
// ACTIVITIES (Interaction Log)
// ============================================
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "cascade",
    }),

    // Activity types: call, email, demo, meeting, note, linkedin_message
    type: varchar("type", { length: 50 }).notNull(),
    subject: varchar("subject", { length: 255 }),
    description: text("description"),
    outcome: varchar("outcome", { length: 50 }), // "completed", "no_answer", "voicemail", "scheduled_followup"

    // For scheduled activities (future)
    scheduledAt: timestamp("scheduled_at"),
    completedAt: timestamp("completed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("activities_deal_idx").on(table.dealId),
    index("activities_contact_idx").on(table.contactId),
    index("activities_scheduled_idx").on(table.scheduledAt),
    index("activities_created_idx").on(table.createdAt),
  ]
);

// ============================================
// REMINDERS (Follow-up Tasks)
// ============================================
export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dealId: uuid("deal_id").references(() => deals.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "cascade",
    }),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    dueAt: timestamp("due_at").notNull(),

    isCompleted: boolean("is_completed").default(false),
    completedAt: timestamp("completed_at"),

    // Priority for sorting
    priority: varchar("priority", { length: 20 }).default("medium"), // "low", "medium", "high"

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("reminders_deal_idx").on(table.dealId),
    index("reminders_contact_idx").on(table.contactId),
    index("reminders_due_idx").on(table.dueAt),
    index("reminders_completed_idx").on(table.isCompleted),
  ]
);

// ============================================
// RELATIONS
// ============================================
export const contactsRelations = relations(contacts, ({ many }) => ({
  deals: many(deals),
  activities: many(activities),
  reminders: many(reminders),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
  activities: many(activities),
  reminders: many(reminders),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  deal: one(deals, {
    fields: [activities.dealId],
    references: [deals.id],
  }),
  contact: one(contacts, {
    fields: [activities.contactId],
    references: [contacts.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  deal: one(deals, {
    fields: [reminders.dealId],
    references: [deals.id],
  }),
  contact: one(contacts, {
    fields: [reminders.contactId],
    references: [contacts.id],
  }),
}));

// Type exports
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
