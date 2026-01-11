import { NextResponse } from "next/server";
import { isGmailConfigured, isGmailConnected } from "@/lib/gmail/client";

export async function GET() {
  const configured = isGmailConfigured();
  const connected = configured ? await isGmailConnected() : false;

  return NextResponse.json({
    configured,
    connected,
  });
}
