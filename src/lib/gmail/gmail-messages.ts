/**
 * Gmail Message Operations
 */

import type { GmailAccount } from "@/lib/db/schema";
import type { GmailMessage, FetchEmailsOptions } from "./gmail-types";
import { getValidAccessTokenForAccount, getAllGmailAccounts } from "./gmail-accounts";
import { parseEmailAddress, getEmailBody } from "./gmail-utils";

/**
 * Fetch emails from a specific Gmail account
 */
export async function fetchEmailsFromAccount(
  account: GmailAccount,
  options: FetchEmailsOptions = {}
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
// LEGACY FUNCTIONS (Backward Compatibility)
// ============================================

/**
 * Legacy: Fetch emails from first connected account
 */
export async function fetchEmails(
  options: FetchEmailsOptions = {}
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
