import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deals, processedEmails, emailDrafts } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

// POST - Delete multiple deals
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Deal IDs are required" },
        { status: 400 }
      );
    }

    // First, unlink related records that don't have cascade delete
    await db
      .update(processedEmails)
      .set({ dealId: null })
      .where(inArray(processedEmails.dealId, ids));

    await db
      .update(emailDrafts)
      .set({ dealId: null })
      .where(inArray(emailDrafts.dealId, ids));

    // Now delete the deals (activities and reminders have cascade delete)
    await db.delete(deals).where(inArray(deals.id, ids));

    return NextResponse.json({
      message: `${ids.length} deal(s) deleted successfully`,
      deletedCount: ids.length,
    });
  } catch (error) {
    console.error("Error bulk deleting deals:", error);
    return NextResponse.json(
      { message: "Failed to delete deals" },
      { status: 500 }
    );
  }
}
