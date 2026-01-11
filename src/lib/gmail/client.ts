/**
 * Gmail API Client
 *
 * Handles OAuth authentication and email fetching for the CRM.
 * Tokens are stored in the settings table.
 */

import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || "http://localhost:3000/api/gmail/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
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

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GmailTokens> {
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

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<GmailTokens> {
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
    throw new Error("Gmail credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: refreshToken,
    expiry_date: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Save tokens to the database
 */
export async function saveTokens(tokens: GmailTokens): Promise<void> {
  const tokenString = JSON.stringify(tokens);

  await db
    .insert(settings)
    .values({
      key: "gmail_tokens",
      value: tokenString,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: tokenString, updatedAt: new Date() },
    });
}

/**
 * Get tokens from the database
 */
export async function getTokens(): Promise<GmailTokens | null> {
  const setting = await db.query.settings.findFirst({
    where: eq(settings.key, "gmail_tokens"),
  });

  if (!setting?.value) return null;

  return JSON.parse(setting.value);
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  if (!tokens) return null;

  // Check if token is expired (with 5 minute buffer)
  if (tokens.expiry_date < Date.now() + 5 * 60 * 1000) {
    try {
      const newTokens = await refreshAccessToken(tokens.refresh_token);
      await saveTokens(newTokens);
      return newTokens.access_token;
    } catch (error) {
      console.error("Failed to refresh Gmail token:", error);
      return null;
    }
  }

  return tokens.access_token;
}

/**
 * Check if Gmail is connected (has valid tokens)
 */
export async function isGmailConnected(): Promise<boolean> {
  const token = await getValidAccessToken();
  return Boolean(token);
}

/**
 * Disconnect Gmail (remove tokens)
 */
export async function disconnectGmail(): Promise<void> {
  await db.delete(settings).where(eq(settings.key, "gmail_tokens"));
}

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
function getEmailBody(payload: { body?: { data?: string }; parts?: { mimeType: string; body?: { data?: string } }[] }): string {
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

/**
 * Fetch unread emails from Gmail
 */
export async function fetchUnreadEmails(
  labelFilter?: string,
  maxResults = 10
): Promise<GmailMessage[]> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error("Gmail not connected");
  }

  // Build query
  let query = "is:unread";
  if (labelFilter) {
    query += ` label:${labelFilter}`;
  }

  // List messages
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("q", query);
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

    const fromHeader = headers.find((h: { name: string }) => h.name === "From")?.value || "";
    const subjectHeader = headers.find((h: { name: string }) => h.name === "Subject")?.value || "";
    const dateHeader = headers.find((h: { name: string }) => h.name === "Date")?.value || "";

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
 * Mark an email as read
 */
export async function markAsRead(messageId: string): Promise<void> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error("Gmail not connected");
  }

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
 * Add a label to an email
 */
export async function addLabel(messageId: string, labelName: string): Promise<void> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error("Gmail not connected");
  }

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
