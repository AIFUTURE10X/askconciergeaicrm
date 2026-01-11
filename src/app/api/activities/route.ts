import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities, deals, contacts } from "@/lib/db/schema";
import { eq, desc, or, and } from "drizzle-orm";

// GET - List activities (filtered by dealId or contactId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("dealId");
    const contactId = searchParams.get("contactId");
    const limit = parseInt(searchParams.get("limit") || "50");

    let activityList;

    if (dealId) {
      activityList = await db.query.activities.findMany({
        where: eq(activities.dealId, dealId),
        with: {
          deal: true,
          contact: true,
        },
        orderBy: [desc(activities.createdAt)],
        limit,
      });
    } else if (contactId) {
      activityList = await db.query.activities.findMany({
        where: eq(activities.contactId, contactId),
        with: {
          deal: true,
          contact: true,
        },
        orderBy: [desc(activities.createdAt)],
        limit,
      });
    } else {
      activityList = await db.query.activities.findMany({
        with: {
          deal: true,
          contact: true,
        },
        orderBy: [desc(activities.createdAt)],
        limit,
      });
    }

    return NextResponse.json({ activities: activityList });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { message: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

// POST - Log a new activity
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      dealId,
      contactId,
      type,
      subject,
      description,
      outcome,
      scheduledAt,
      completedAt,
    } = body;

    if (!type) {
      return NextResponse.json(
        { message: "Activity type is required" },
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

    const [newActivity] = await db
      .insert(activities)
      .values({
        dealId: dealId || null,
        contactId: contactId || null,
        type,
        subject,
        description,
        outcome,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
      })
      .returning();

    // Fetch with relations
    const activityWithRelations = await db.query.activities.findFirst({
      where: eq(activities.id, newActivity.id),
      with: {
        deal: true,
        contact: true,
      },
    });

    return NextResponse.json(
      { activity: activityWithRelations, message: "Activity logged successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { message: "Failed to log activity" },
      { status: 500 }
    );
  }
}
