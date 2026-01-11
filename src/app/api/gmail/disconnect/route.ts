import { NextResponse } from "next/server";
import { disconnectGmail } from "@/lib/gmail/client";

export async function POST() {
  try {
    await disconnectGmail();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gmail disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Gmail" },
      { status: 500 }
    );
  }
}
