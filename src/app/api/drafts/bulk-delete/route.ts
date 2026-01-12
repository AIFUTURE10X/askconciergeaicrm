import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailDrafts } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

// POST - Delete multiple drafts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Draft IDs are required" },
        { status: 400 }
      );
    }

    await db.delete(emailDrafts).where(inArray(emailDrafts.id, ids));

    return NextResponse.json({
      message: `${ids.length} draft(s) deleted successfully`,
      deletedCount: ids.length,
    });
  } catch (error) {
    console.error("Error bulk deleting drafts:", error);
    return NextResponse.json(
      { message: "Failed to delete drafts" },
      { status: 500 }
    );
  }
}
