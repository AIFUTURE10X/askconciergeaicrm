import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, upsertGmailAccount } from "@/lib/gmail/client";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?gmail=error&message=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?gmail=error&message=No+authorization+code", request.url)
    );
  }

  try {
    // Exchange code for tokens and get user email
    const { tokens, email } = await exchangeCodeForTokens(code);

    // Save or update the Gmail account
    await upsertGmailAccount(email, tokens);

    return NextResponse.redirect(
      new URL(`/settings?gmail=success&email=${encodeURIComponent(email)}`, request.url)
    );
  } catch (err) {
    console.error("Gmail OAuth error:", err);
    return NextResponse.redirect(
      new URL(`/settings?gmail=error&message=${encodeURIComponent(String(err))}`, request.url)
    );
  }
}
