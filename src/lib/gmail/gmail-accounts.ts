/**
 * Gmail Account Management
 */

import { db } from "@/lib/db";
import { gmailAccounts, settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { GmailAccount } from "@/lib/db/schema";
import type { GmailTokens } from "./gmail-types";
import { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI } from "./gmail-config";

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
export async function refreshAccountToken(account: GmailAccount): Promise<string> {
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

/**
 * Check if any Gmail account is connected
 */
export async function isGmailConnected(): Promise<boolean> {
  const accounts = await getAllGmailAccounts();
  return accounts.length > 0;
}

/**
 * Legacy: Disconnect Gmail (for backward compatibility)
 */
export async function disconnectGmail(): Promise<void> {
  await db
    .update(gmailAccounts)
    .set({ isActive: false, updatedAt: new Date() });
}

/**
 * Migrate legacy single-account tokens to multi-account table
 */
export async function migrateLegacyTokens(): Promise<void> {
  const setting = await db.query.settings.findFirst({
    where: eq(settings.key, "gmail_tokens"),
  });

  if (!setting?.value) return;

  const legacyTokens: GmailTokens = JSON.parse(setting.value);

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
