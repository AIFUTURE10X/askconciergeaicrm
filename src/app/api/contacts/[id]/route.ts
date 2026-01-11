import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single contact with deals and activities
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, id),
      with: {
        deals: {
          with: {
            activities: {
              orderBy: (activities, { desc }) => [desc(activities.createdAt)],
              limit: 5,
            },
          },
        },
        activities: {
          orderBy: (activities, { desc }) => [desc(activities.createdAt)],
          limit: 20,
        },
        reminders: {
          orderBy: (reminders, { asc }) => [asc(reminders.dueAt)],
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { message: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { message: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

// PATCH - Update contact
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingContact = await db.query.contacts.findFirst({
      where: eq(contacts.id, id),
    });

    if (!existingContact) {
      return NextResponse.json(
        { message: "Contact not found" },
        { status: 404 }
      );
    }

    const {
      name,
      email,
      phone,
      company,
      title,
      propertyType,
      website,
      linkedinUrl,
      notes,
      source,
      tags,
    } = body;

    const updateData: Partial<typeof contacts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (title !== undefined) updateData.title = title;
    if (propertyType !== undefined) updateData.propertyType = propertyType;
    if (website !== undefined) updateData.website = website;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
    if (notes !== undefined) updateData.notes = notes;
    if (source !== undefined) updateData.source = source;
    if (tags !== undefined) updateData.tags = tags;

    const [updatedContact] = await db
      .update(contacts)
      .set(updateData)
      .where(eq(contacts.id, id))
      .returning();

    return NextResponse.json({
      contact: updatedContact,
      message: "Contact updated successfully",
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { message: "Failed to update contact" },
      { status: 500 }
    );
  }
}

// DELETE - Delete contact
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existingContact = await db.query.contacts.findFirst({
      where: eq(contacts.id, id),
    });

    if (!existingContact) {
      return NextResponse.json(
        { message: "Contact not found" },
        { status: 404 }
      );
    }

    await db.delete(contacts).where(eq(contacts.id, id));

    return NextResponse.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { message: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
