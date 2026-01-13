import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  contacts,
  deals,
  processedEmails,
  emailDrafts,
} from "@/lib/db/schema";
import { inArray, eq } from "drizzle-orm";

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

    // Get all deal IDs for these contacts (they will cascade delete)
    const contactDeals = await db
      .select({ id: deals.id })
      .from(deals)
      .where(inArray(deals.contactId, contactIds));
    const dealIds = contactDeals.map((d) => d.id);

    // Clear contactId references in tables without cascade delete
    await db
      .update(processedEmails)
      .set({ contactId: null })
      .where(inArray(processedEmails.contactId, contactIds));

    await db
      .update(emailDrafts)
      .set({ contactId: null })
      .where(inArray(emailDrafts.contactId, contactIds));

    // Clear dealId references for deals that will be cascade deleted
    if (dealIds.length > 0) {
      await db
        .update(processedEmails)
        .set({ dealId: null })
        .where(inArray(processedEmails.dealId, dealIds));

      await db
        .update(emailDrafts)
        .set({ dealId: null })
        .where(inArray(emailDrafts.dealId, dealIds));
    }

    // Now delete the contacts (deals, activities, reminders cascade automatically)
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
