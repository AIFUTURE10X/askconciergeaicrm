/**
 * Email Drafts API
 *
 * GET - List all drafts (with optional status filter)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailDrafts } from "@/lib/db/schema";
import { desc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const statuses = searchParams.get("statuses")?.split(",");

    const drafts = await db.query.emailDrafts.findMany({
      where: statuses ? inArray(emailDrafts.status, statuses) : undefined,
      with: {
        contact: true,
        deal: true,
      },
      orderBy: [desc(emailDrafts.createdAt)],
    });

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error("[Drafts API] Error fetching drafts:", error);
    return NextResponse.json(
      { message: "Failed to fetch drafts" },
      { status: 500 }
    );
  }
}
