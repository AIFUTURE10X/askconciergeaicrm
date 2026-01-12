// Re-export all tables
export {
  contacts,
  deals,
  activities,
  reminders,
  settings,
  gmailAccounts,
  processedEmails,
  emailDrafts,
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
  contacts,
  deals,
  activities,
  reminders,
  settings,
  gmailAccounts,
  processedEmails,
  emailDrafts,
} from "./tables";

// Type exports
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
