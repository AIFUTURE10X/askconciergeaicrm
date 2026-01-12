/**
 * Gmail API Client
 *
 * Handles OAuth authentication and email fetching for the CRM.
 * Supports multiple Gmail accounts for different businesses.
 */

import { db } from "@/lib/db";
import { gmailAccounts, settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { GmailAccount } from "@/lib/db/schema";

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const GMAIL_REDIRECT_URI =
  process.env.GMAIL_REDIRECT_URI || "http://localhost:3000/api/gmail/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
];

interface GmailTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  body: string;
  date: Date;
}

// ============================================
// CONFIGURATION
// ============================================

/**
 * Check if Gmail is configured (has client ID and secret)
 */
export function isGmailConfigured(): boolean {
  return Boolean(GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET);
}

/**
 * Get the OAuth authorization URL
 */
export function getAuthUrl(): string {
  if (!GMAIL_CLIENT_ID) {
    throw new Error("GMAIL_CLIENT_ID not configured");
  }

  const params = new URLSearchParams({
    client_id: GMAIL_CLIENT_ID,
    redirect_uri: GMAIL_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ============================================
// MULTI-ACCOUNT FUNCTIONS
// ============================================

/**
 * Get all connected Gmail accounts
 */
export async function getAllGmailAccounts(): Promise<GmailAccount[]> {
  return db.query.gmailAccounts.findMany({
    where: eq(gmailAccounts.isActive, true),
    orderBy: (accounts, { asc }) => [asc(accounts.createdAt)],
  });
}

/**
 * Get a Gmail account by ID
 */
export async function getGmailAccountById(
  id: string
): Promise<GmailAccount | undefined> {
  return db.query.gmailAccounts.findFirst({
    where: eq(gmailAccounts.id, id),
  });
}

/**
 * Get a Gmail account by email
 */
export async function getGmailAccountByEmail(
  email: string
): Promise<GmailAccount | undefined> {
  return db.query.gmailAccounts.findFirst({
    where: eq(gmailAccounts.email, email.toLowerCase()),
  });
}

/**
 * Exchange authorization code for tokens and get user email
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  tokens: GmailTokens;
  email: string;
}> {
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
    throw new Error("Gmail credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      redirect_uri: GMAIL_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  const tokens: GmailTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Date.now() + data.expires_in * 1000,
  };

  // Get user's email address
  const userInfoRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }
  );

  if (!userInfoRes.ok) {
    throw new Error("Failed to get user info");
  }

  const userInfo = await userInfoRes.json();

  return { tokens, email: userInfo.email };
}

/**
 * Add or update a Gmail account
 */
export async function upsertGmailAccount(
  email: string,
  tokens: GmailTokens,
  name?: string
): Promise<GmailAccount> {
  const existing = await getGmailAccountByEmail(email);

  if (existing) {
    // Update existing account
    const [updated] = await db
      .update(gmailAccounts)
      .set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: new Date(tokens.expiry_date),
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(gmailAccounts.id, existing.id))
      .returning();

    return updated;
  }

  // Create new account
  const [created] = await db
    .insert(gmailAccounts)
    .values({
      email: email.toLowerCase(),
      name: name || email.split("@")[0],
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: new Date(tokens.expiry_date),
    })
    .returning();

  return created;
}

/**
 * Disconnect a Gmail account (soft delete)
 */
export async function disconnectGmailAccount(accountId: string): Promise<void> {
  await db
    .update(gmailAccounts)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(gmailAccounts.id, accountId));
}

/**
 * Update account name/label
 */
export async function updateGmailAccountName(
  accountId: string,
  name: string
): Promise<void> {
  await db
    .update(gmailAccounts)
    .set({ name, updatedAt: new Date() })
    .where(eq(gmailAccounts.id, accountId));
}

/**
 * Update last sync time for an account
 */
export async function updateLastSyncTime(accountId: string): Promise<void> {
  await db
    .update(gmailAccounts)
    .set({ lastSyncAt: new Date(), updatedAt: new Date() })
    .where(eq(gmailAccounts.id, accountId));
}

/**
 * Refresh the access token for an account
 */
async function refreshAccountToken(account: GmailAccount): Promise<string> {
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
    throw new Error("Gmail credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: account.refreshToken,
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    // Mark account as disconnected if refresh fails
    await db
      .update(gmailAccounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(gmailAccounts.id, account.id));
    throw new Error("Token refresh failed - account disconnected");
  }

  const data = await response.json();

  // Update the stored tokens
  await db
    .update(gmailAccounts)
    .set({
      accessToken: data.access_token,
      expiryDate: new Date(Date.now() + data.expires_in * 1000),
      updatedAt: new Date(),
    })
    .where(eq(gmailAccounts.id, account.id));

  return data.access_token;
}

/**
 * Get a valid access token for an account, refreshing if necessary
 */
export async function getValidAccessTokenForAccount(
  account: GmailAccount
): Promise<string> {
  // Check if token is expired (with 5 minute buffer)
  const expiryTime = new Date(account.expiryDate).getTime();
  if (expiryTime < Date.now() + 5 * 60 * 1000) {
    return refreshAccountToken(account);
  }

  return account.accessToken;
}

// ============================================
// EMAIL OPERATIONS (Account-specific)
// ============================================

/**
 * Fetch emails from a specific Gmail account
 */
export async function fetchEmailsFromAccount(
  account: GmailAccount,
  options: {
    maxResults?: number;
    onlyUnread?: boolean;
    newerThanDays?: number;
  } = {}
): Promise<GmailMessage[]> {
  const { maxResults = 10, onlyUnread = false, newerThanDays } = options;

  const accessToken = await getValidAccessTokenForAccount(account);

  // Build query
  const queryParts: string[] = [];

  if (onlyUnread) {
    queryParts.push("is:unread");
  }

  if (account.labelFilter) {
    queryParts.push(`label:${account.labelFilter}`);
  }

  if (newerThanDays) {
    queryParts.push(`newer_than:${newerThanDays}d`);
  }

  const query = queryParts.join(" ") || undefined;

  // List messages
  const listUrl = new URL(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages"
  );
  if (query) {
    listUrl.searchParams.set("q", query);
  }
  listUrl.searchParams.set("maxResults", String(maxResults));

  const listResponse = await fetch(listUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listResponse.ok) {
    const error = await listResponse.text();
    throw new Error(`Failed to list emails: ${error}`);
  }

  const listData = await listResponse.json();
  const messageIds = listData.messages || [];

  // Fetch full message details
  const messages: GmailMessage[] = [];

  for (const { id } of messageIds) {
    const msgResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!msgResponse.ok) continue;

    const msgData = await msgResponse.json();
    const headers = msgData.payload?.headers || [];

    const fromHeader =
      headers.find((h: { name: string }) => h.name === "From")?.value || "";
    const subjectHeader =
      headers.find((h: { name: string }) => h.name === "Subject")?.value || "";
    const dateHeader =
      headers.find((h: { name: string }) => h.name === "Date")?.value || "";

    const { name, email } = parseEmailAddress(fromHeader);

    messages.push({
      id: msgData.id,
      threadId: msgData.threadId,
      from: fromHeader,
      fromEmail: email,
      fromName: name,
      subject: subjectHeader,
      body: getEmailBody(msgData.payload),
      date: new Date(dateHeader),
    });
  }

  return messages;
}

/**
 * Mark an email as read (account-specific)
 */
export async function markAsReadForAccount(
  account: GmailAccount,
  messageId: string
): Promise<void> {
  const accessToken = await getValidAccessTokenForAccount(account);

  await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        removeLabelIds: ["UNREAD"],
      }),
    }
  );
}

/**
 * Add a label to an email (account-specific)
 */
export async function addLabelForAccount(
  account: GmailAccount,
  messageId: string,
  labelName: string
): Promise<void> {
  const accessToken = await getValidAccessTokenForAccount(account);

  // First, get or create the label
  const labelsResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/labels",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const labelsData = await labelsResponse.json();
  let labelId = labelsData.labels?.find(
    (l: { name: string }) => l.name === labelName
  )?.id;

  // Create label if it doesn't exist
  if (!labelId) {
    const createResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/labels",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: labelName }),
      }
    );
    const createData = await createResponse.json();
    labelId = createData.id;
  }

  // Add label to message
  await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addLabelIds: [labelId],
      }),
    }
  );
}

/**
 * Send an email reply (account-specific)
 */
export async function sendReplyForAccount(
  account: GmailAccount,
  threadId: string,
  to: string,
  subject: string,
  body: string
): Promise<string> {
  const accessToken = await getValidAccessTokenForAccount(account);

  // Build the email
  const emailLines = [
    `To: ${to}`,
    `From: ${account.name || account.email} <${account.email}>`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ];
  const email = emailLines.join("\r\n");
  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: encodedEmail,
        threadId,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

// ============================================
// BACKWARD COMPATIBILITY (Legacy functions)
// ============================================

/**
 * Check if any Gmail account is connected
 */
export async function isGmailConnected(): Promise<boolean> {
  const accounts = await getAllGmailAccounts();
  return accounts.length > 0;
}

/**
 * Legacy: Get tokens from settings table (for migration)
 */
async function getLegacyTokens(): Promise<GmailTokens | null> {
  const setting = await db.query.settings.findFirst({
    where: eq(settings.key, "gmail_tokens"),
  });

  if (!setting?.value) return null;

  return JSON.parse(setting.value);
}

/**
 * Migrate legacy single-account tokens to multi-account table
 */
export async function migrateLegacyTokens(): Promise<void> {
  const legacyTokens = await getLegacyTokens();
  if (!legacyTokens) return;

  // Check if we already have accounts
  const existingAccounts = await getAllGmailAccounts();
  if (existingAccounts.length > 0) {
    // Already migrated, delete legacy tokens
    await db.delete(settings).where(eq(settings.key, "gmail_tokens"));
    return;
  }

  // Get email address using the token
  try {
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${legacyTokens.access_token}` },
      }
    );

    if (userInfoRes.ok) {
      const userInfo = await userInfoRes.json();
      await upsertGmailAccount(userInfo.email, legacyTokens, "Primary Account");
    }
  } catch {
    // If we can't get the email, skip migration
    console.error("Failed to migrate legacy Gmail tokens");
  }

  // Delete legacy tokens
  await db.delete(settings).where(eq(settings.key, "gmail_tokens"));
}

/**
 * Legacy: Disconnect Gmail (for backward compatibility)
 */
export async function disconnectGmail(): Promise<void> {
  // Disconnect all accounts
  await db
    .update(gmailAccounts)
    .set({ isActive: false, updatedAt: new Date() });
}

/**
 * Legacy: Fetch emails from first connected account
 */
export async function fetchEmails(
  options: {
    labelFilter?: string;
    maxResults?: number;
    onlyUnread?: boolean;
    newerThanDays?: number;
  } = {}
): Promise<GmailMessage[]> {
  const accounts = await getAllGmailAccounts();
  if (accounts.length === 0) {
    throw new Error("Gmail not connected");
  }

  // Use first account for backward compatibility
  return fetchEmailsFromAccount(accounts[0], options);
}

/**
 * Legacy: Fetch unread emails (backward compatible)
 */
export async function fetchUnreadEmails(
  labelFilter?: string,
  maxResults = 10
): Promise<GmailMessage[]> {
  return fetchEmails({
    labelFilter,
    maxResults,
    onlyUnread: true,
  });
}

/**
 * Legacy: Mark as read using first account
 */
export async function markAsRead(messageId: string): Promise<void> {
  const accounts = await getAllGmailAccounts();
  if (accounts.length === 0) {
    throw new Error("Gmail not connected");
  }

  await markAsReadForAccount(accounts[0], messageId);
}

/**
 * Legacy: Add label using first account
 */
export async function addLabel(
  messageId: string,
  labelName: string
): Promise<void> {
  const accounts = await getAllGmailAccounts();
  if (accounts.length === 0) {
    throw new Error("Gmail not connected");
  }

  await addLabelForAccount(accounts[0], messageId, labelName);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse email address from "Name <email>" format
 */
function parseEmailAddress(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: from, email: from };
}

/**
 * Decode base64url encoded content
 */
function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Get the email body from message parts
 */
function getEmailBody(payload: {
  body?: { data?: string };
  parts?: { mimeType: string; body?: { data?: string } }[];
}): string {
  // Direct body
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Multipart - find text/plain
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    // Fallback to text/html
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        // Strip HTML tags for plain text
        const html = decodeBase64Url(part.body.data);
        return html.replace(/<[^>]*>/g, "").trim();
      }
    }
  }

  return "";
}
