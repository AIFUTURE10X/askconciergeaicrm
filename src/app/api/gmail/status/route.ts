import { NextResponse } from "next/server";
import {
  isGmailConfigured,
  getAllGmailAccounts,
  migrateLegacyTokens,
} from "@/lib/gmail/client";

export async function GET() {
  const configured = isGmailConfigured();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      accounts: [],
    });
  }

  // Try to migrate legacy tokens
  try {
    await migrateLegacyTokens();
  } catch {
    // Migration might fail, that's ok
  }

  // Get all connected accounts
  const accounts = await getAllGmailAccounts();

  return NextResponse.json({
    configured: true,
    connected: accounts.length > 0,
    accounts: accounts.map((a) => ({
      id: a.id,
      email: a.email,
      name: a.name,
      lastSyncAt: a.lastSyncAt,
      createdAt: a.createdAt,
    })),
  });
}
