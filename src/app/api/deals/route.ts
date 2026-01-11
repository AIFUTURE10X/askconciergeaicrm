import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deals, contacts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET - List all deals
export async function GET() {
  try {
    const dealList = await db.query.deals.findMany({
      with: {
        contact: true,
      },
      orderBy: [desc(deals.createdAt)],
    });

    return NextResponse.json({ deals: dealList });
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json(
      { message: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

// POST - Create a new deal
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      contactId,
      stage = "lead",
      tier,
      value,
      billingPeriod = "monthly",
      propertyCount = 1,
      probability = 10,
      expectedCloseDate,
      notes,
    } = body;

    if (!title) {
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 }
      );
    }

    // If contactId provided, verify it exists
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

    const [newDeal] = await db
      .insert(deals)
      .values({
        title,
        contactId: contactId || null,
        stage,
        tier,
        value: value ? String(value) : null,
        billingPeriod,
        propertyCount,
        probability,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        notes,
      })
      .returning();

    // Fetch with contact relation
    const dealWithContact = await db.query.deals.findFirst({
      where: eq(deals.id, newDeal.id),
      with: { contact: true },
    });

    return NextResponse.json(
      { deal: dealWithContact, message: "Deal created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating deal:", error);
    return NextResponse.json(
      { message: "Failed to create deal" },
      { status: 500 }
    );
  }
}
