/**
 * Gmail Send API
 *
 * Handles sending emails via Gmail API.
 * Requires gmail.send scope.
 */

import { getValidAccessToken } from "./client";

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  threadId?: string; // For replies in same thread
  inReplyTo?: string; // Original message ID for proper threading
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

/**
 * Encode email in base64url format for Gmail API
 */
function encodeEmail(
  to: string,
  subject: string,
  body: string,
  inReplyTo?: string
): string {
  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=utf-8`,
  ];

  if (inReplyTo) {
    headers.push(`In-Reply-To: <${inReplyTo}>`);
    headers.push(`References: <${inReplyTo}>`);
  }

  const email = `${headers.join("\r\n")}\r\n\r\n${body}`;

  // Convert to base64url
  return Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return { success: false, error: "Gmail not connected" };
  }

  const raw = encodeEmail(
    params.to,
    params.subject,
    params.body,
    params.inReplyTo
  );

  const requestBody: { raw: string; threadId?: string } = { raw };
  if (params.threadId) {
    requestBody.threadId = params.threadId;
  }

  try {
    const response = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("[Gmail Send] Failed:", error);
      return { success: false, error: `Failed to send: ${response.status}` };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
      threadId: data.threadId,
    };
  } catch (error) {
    console.error("[Gmail Send] Error:", error);
    return { success: false, error: String(error) };
  }
}
