import { NextResponse } from "next/server";
import { getAuthUrl, isGmailConfigured } from "@/lib/gmail/client";

export async function GET() {
  if (!isGmailConfigured()) {
    return NextResponse.json(
      { error: "Gmail not configured. Add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to environment." },
      { status: 500 }
    );
  }

  const authUrl = getAuthUrl();
  return NextResponse.redirect(authUrl);
}
