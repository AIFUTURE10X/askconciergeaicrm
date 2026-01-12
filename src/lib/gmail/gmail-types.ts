/**
 * Gmail API Types
 */

export interface GmailTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  body: string;
  date: Date;
}

export interface FetchEmailsOptions {
  maxResults?: number;
  onlyUnread?: boolean;
  newerThanDays?: number;
  labelFilter?: string;
}
