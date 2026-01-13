import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { inArray, sql } from "drizzle-orm";

// POST /api/contacts/bulk-tags - Apply tags to multiple contacts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contactIds, tagIds, action } = body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: "Contact IDs are required" },
        { status: 400 }
      );
    }

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        { error: "Tag IDs are required" },
        { status: 400 }
      );
    }

    // Get current contacts with their tags
    const currentContacts = await db
      .select({ id: contacts.id, tags: contacts.tags })
      .from(contacts)
      .where(inArray(contacts.id, contactIds));

    // Update each contact's tags
    const updates = currentContacts.map(async (contact) => {
      const currentTags = (contact.tags as string[]) || [];
      let newTags: string[];

      if (action === "remove") {
        // Remove specified tags
        newTags = currentTags.filter((t) => !tagIds.includes(t));
      } else {
        // Add tags (default action)
        const tagsToAdd = tagIds.filter((t: string) => !currentTags.includes(t));
        newTags = [...currentTags, ...tagsToAdd];
      }

      return db
        .update(contacts)
        .set({
          tags: newTags,
          updatedAt: new Date(),
        })
        .where(sql`${contacts.id} = ${contact.id}`);
    });

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      updatedCount: contactIds.length,
    });
  } catch (error) {
    console.error("Error bulk updating tags:", error);
    return NextResponse.json(
      { error: "Failed to update tags" },
      { status: 500 }
    );
  }
}
