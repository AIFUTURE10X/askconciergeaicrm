import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

// POST /api/contacts/bulk-delete - Delete multiple contacts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contactIds } = body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: "Contact IDs are required" },
        { status: 400 }
      );
    }

    const deletedContacts = await db
      .delete(contacts)
      .where(inArray(contacts.id, contactIds))
      .returning({ id: contacts.id });

    return NextResponse.json({
      success: true,
      deletedCount: deletedContacts.length,
    });
  } catch (error) {
    console.error("Error bulk deleting contacts:", error);
    return NextResponse.json(
      { error: "Failed to delete contacts" },
      { status: 500 }
    );
  }
}
