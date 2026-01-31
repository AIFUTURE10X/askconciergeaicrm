// Re-export all tables
export {
  tags,
  contacts,
  deals,
  activities,
  reminders,
  settings,
  gmailAccounts,
  processedEmails,
  emailDrafts,
  churnReasonEnum,
  churnReasons,
} from "./tables";

// Re-export all relations
export {
  contactsRelations,
  dealsRelations,
  activitiesRelations,
  remindersRelations,
  gmailAccountsRelations,
  processedEmailsRelations,
  emailDraftsRelations,
} from "./relations";

// Import tables for type inference
import {
  tags,
  contacts,
  deals,
  activities,
  reminders,
  settings,
  gmailAccounts,
  processedEmails,
  emailDrafts,
  churnReasons,
} from "./tables";

// Type exports
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type GmailAccount = typeof gmailAccounts.$inferSelect;
export type NewGmailAccount = typeof gmailAccounts.$inferInsert;
export type ProcessedEmail = typeof processedEmails.$inferSelect;
export type EmailDraft = typeof emailDrafts.$inferSelect;
export type NewEmailDraft = typeof emailDrafts.$inferInsert;
export type ChurnReason = typeof churnReasons.$inferSelect;
export type NewChurnReason = typeof churnReasons.$inferInsert;
