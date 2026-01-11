import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, saveTokens } from "@/lib/gmail/client";

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
    const tokens = await exchangeCodeForTokens(code);
    await saveTokens(tokens);

    return NextResponse.redirect(
      new URL("/settings?gmail=success", request.url)
    );
  } catch (err) {
    console.error("Gmail OAuth error:", err);
    return NextResponse.redirect(
      new URL(`/settings?gmail=error&message=${encodeURIComponent(String(err))}`, request.url)
    );
  }
}
