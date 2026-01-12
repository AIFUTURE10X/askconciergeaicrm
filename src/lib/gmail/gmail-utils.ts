/**
 * Gmail Helper Functions
 */

/**
 * Parse email address from "Name <email>" format
 */
export function parseEmailAddress(from: string): { name: string; email: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: from, email: from };
}

/**
 * Decode base64url encoded content
 */
export function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Get the email body from message parts
 */
export function getEmailBody(payload: {
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
