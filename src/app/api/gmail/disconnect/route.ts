import { NextRequest, NextResponse } from "next/server";
import { disconnectGmail, disconnectGmailAccount } from "@/lib/gmail/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { accountId } = body;

    if (accountId) {
      // Disconnect specific account
      await disconnectGmailAccount(accountId);
    } else {
      // Disconnect all accounts (legacy behavior)
      await disconnectGmail();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gmail disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Gmail" },
      { status: 500 }
    );
  }
}
