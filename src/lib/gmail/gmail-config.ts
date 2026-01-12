/**
 * Gmail Configuration
 */

export const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
export const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
export const GMAIL_REDIRECT_URI =
  process.env.GMAIL_REDIRECT_URI || "http://localhost:3000/api/gmail/callback";

export const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
] as const;

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
