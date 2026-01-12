import { relations } from "drizzle-orm";
import {
  contacts,
  deals,
  activities,
  reminders,
  gmailAccounts,
  processedEmails,
  emailDrafts,
} from "./tables";

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
  gmailAccount: one(gmailAccounts, {
    fields: [deals.gmailAccountId],
    references: [gmailAccounts.id],
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

export const gmailAccountsRelations = relations(gmailAccounts, ({ many }) => ({
  deals: many(deals),
  processedEmails: many(processedEmails),
  emailDrafts: many(emailDrafts),
}));

export const processedEmailsRelations = relations(processedEmails, ({ one }) => ({
  gmailAccount: one(gmailAccounts, {
    fields: [processedEmails.gmailAccountId],
    references: [gmailAccounts.id],
  }),
  contact: one(contacts, {
    fields: [processedEmails.contactId],
    references: [contacts.id],
  }),
  deal: one(deals, {
    fields: [processedEmails.dealId],
    references: [deals.id],
  }),
}));

export const emailDraftsRelations = relations(emailDrafts, ({ one }) => ({
  processedEmail: one(processedEmails, {
    fields: [emailDrafts.processedEmailId],
    references: [processedEmails.id],
  }),
  gmailAccount: one(gmailAccounts, {
    fields: [emailDrafts.gmailAccountId],
    references: [gmailAccounts.id],
  }),
  contact: one(contacts, {
    fields: [emailDrafts.contactId],
    references: [contacts.id],
  }),
  deal: one(deals, {
    fields: [emailDrafts.dealId],
    references: [deals.id],
  }),
}));
