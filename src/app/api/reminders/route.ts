import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders, deals, contacts } from "@/lib/db/schema";
import { eq, and, asc, gte, lte, desc } from "drizzle-orm";
import { startOfDay, endOfDay, addDays } from "date-fns";

// GET - List reminders
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("dealId");
    const contactId = searchParams.get("contactId");
    const today = searchParams.get("today") === "true";
    const upcoming = searchParams.get("upcoming") === "true";
    const showCompleted = searchParams.get("showCompleted") === "true";

    const conditions = [];

    if (!showCompleted) {
      conditions.push(eq(reminders.isCompleted, false));
    }

    if (dealId) {
      conditions.push(eq(reminders.dealId, dealId));
    }

    if (contactId) {
      conditions.push(eq(reminders.contactId, contactId));
    }

    if (today) {
      const start = startOfDay(new Date());
      const end = endOfDay(new Date());
      conditions.push(gte(reminders.dueAt, start));
      conditions.push(lte(reminders.dueAt, end));
    } else if (upcoming) {
      const start = startOfDay(new Date());
      const end = endOfDay(addDays(new Date(), 7));
      conditions.push(gte(reminders.dueAt, start));
      conditions.push(lte(reminders.dueAt, end));
    }

    const reminderList = await db.query.reminders.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        deal: {
          with: {
            contact: true,
          },
        },
        contact: true,
      },
      orderBy: [asc(reminders.dueAt)],
    });

    return NextResponse.json({ reminders: reminderList });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { message: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}

// POST - Create a new reminder
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      dealId,
      contactId,
      title,
      description,
      dueAt,
      priority = "medium",
    } = body;

    if (!title) {
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 }
      );
    }

    if (!dueAt) {
      return NextResponse.json(
        { message: "Due date is required" },
        { status: 400 }
      );
    }

    // Verify deal exists if provided
    if (dealId) {
      const deal = await db.query.deals.findFirst({
        where: eq(deals.id, dealId),
      });
      if (!deal) {
        return NextResponse.json(
          { message: "Deal not found" },
          { status: 404 }
        );
      }
    }

    // Verify contact exists if provided
    if (contactId) {
      const contact = await db.query.contacts.findFirst({
        where: eq(contacts.id, contactId),
      });
      if (!contact) {
        return NextResponse.json(
          { message: "Contact not found" },
          { status: 404 }
        );
      }
    }

    const [newReminder] = await db
      .insert(reminders)
      .values({
        dealId: dealId || null,
        contactId: contactId || null,
        title,
        description,
        dueAt: new Date(dueAt),
        priority,
      })
      .returning();

    // Fetch with relations
    const reminderWithRelations = await db.query.reminders.findFirst({
      where: eq(reminders.id, newReminder.id),
      with: {
        deal: true,
        contact: true,
      },
    });

    return NextResponse.json(
      { reminder: reminderWithRelations, message: "Reminder created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json(
      { message: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
