/**
 * Gmail API Client
 *
 * Handles OAuth authentication and email fetching for the CRM.
 * Supports multiple Gmail accounts for different businesses.
 *
 * This file re-exports all Gmail functionality from modular files.
 */

// Types
export type { GmailTokens, GmailMessage, FetchEmailsOptions } from "./gmail-types";

// Configuration
export { isGmailConfigured, getAuthUrl } from "./gmail-config";

// Account Management
export {
  getAllGmailAccounts,
  getGmailAccountById,
  getGmailAccountByEmail,
  exchangeCodeForTokens,
  upsertGmailAccount,
  disconnectGmailAccount,
  updateGmailAccountName,
  updateLastSyncTime,
  getValidAccessTokenForAccount,
  isGmailConnected,
  disconnectGmail,
  migrateLegacyTokens,
} from "./gmail-accounts";

// Message Operations
export {
  fetchEmailsFromAccount,
  markAsReadForAccount,
  addLabelForAccount,
  sendReplyForAccount,
  // Legacy functions
  fetchEmails,
  fetchUnreadEmails,
  markAsRead,
  addLabel,
} from "./gmail-messages";

// Utility Functions
export { parseEmailAddress, decodeBase64Url, getEmailBody } from "./gmail-utils";
