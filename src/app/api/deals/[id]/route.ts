import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single deal
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const deal = await db.query.deals.findFirst({
      where: eq(deals.id, id),
      with: {
        contact: true,
        activities: {
          orderBy: (activities, { desc }) => [desc(activities.createdAt)],
          limit: 10,
        },
        reminders: {
          orderBy: (reminders, { asc }) => [asc(reminders.dueAt)],
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ message: "Deal not found" }, { status: 404 });
    }

    return NextResponse.json({ deal });
  } catch (error) {
    console.error("Error fetching deal:", error);
    return NextResponse.json(
      { message: "Failed to fetch deal" },
      { status: 500 }
    );
  }
}

// PATCH - Update deal (including stage changes)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if deal exists
    const existingDeal = await db.query.deals.findFirst({
      where: eq(deals.id, id),
    });

    if (!existingDeal) {
      return NextResponse.json({ message: "Deal not found" }, { status: 404 });
    }

    const {
      title,
      contactId,
      stage,
      tier,
      value,
      billingPeriod,
      propertyCount,
      propertyCountRange,
      leadSource,
      currentSystem,
      painPoint,
      probability,
      expectedCloseDate,
      nextStep,
      followUpDate,
      closedAt,
      lostReason,
      notes,
      sortOrder,
    } = body;

    // Build update object with only provided fields
    const updateData: Partial<typeof deals.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (contactId !== undefined) updateData.contactId = contactId || null;
    if (stage !== undefined) updateData.stage = stage;
    if (tier !== undefined) updateData.tier = tier;
    if (value !== undefined) updateData.value = value ? String(value) : null;
    if (billingPeriod !== undefined) updateData.billingPeriod = billingPeriod;
    if (propertyCount !== undefined) updateData.propertyCount = propertyCount;
    if (propertyCountRange !== undefined) updateData.propertyCountRange = propertyCountRange;
    if (leadSource !== undefined) updateData.leadSource = leadSource;
    if (currentSystem !== undefined) updateData.currentSystem = currentSystem;
    if (painPoint !== undefined) updateData.painPoint = painPoint;
    if (probability !== undefined) updateData.probability = probability;
    if (expectedCloseDate !== undefined) {
      updateData.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
    }
    if (nextStep !== undefined) updateData.nextStep = nextStep;
    if (followUpDate !== undefined) {
      updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;
    }
    if (closedAt !== undefined) {
      updateData.closedAt = closedAt ? new Date(closedAt) : null;
    }
    if (lostReason !== undefined) updateData.lostReason = lostReason;
    if (notes !== undefined) updateData.notes = notes;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    // Handle stage transitions
    if (stage === "closed_won" && !existingDeal.closedAt) {
      updateData.closedAt = new Date();
      updateData.probability = 100;
    } else if (stage === "closed_lost" && !existingDeal.closedAt) {
      updateData.closedAt = new Date();
      updateData.probability = 0;
    }

    const [updatedDeal] = await db
      .update(deals)
      .set(updateData)
      .where(eq(deals.id, id))
      .returning();

    // Fetch with relations
    const dealWithContact = await db.query.deals.findFirst({
      where: eq(deals.id, id),
      with: { contact: true },
    });

    return NextResponse.json({
      deal: dealWithContact,
      message: "Deal updated successfully",
    });
  } catch (error) {
    console.error("Error updating deal:", error);
    return NextResponse.json(
      { message: "Failed to update deal" },
      { status: 500 }
    );
  }
}

// DELETE - Delete deal
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existingDeal = await db.query.deals.findFirst({
      where: eq(deals.id, id),
    });

    if (!existingDeal) {
      return NextResponse.json({ message: "Deal not found" }, { status: 404 });
    }

    await db.delete(deals).where(eq(deals.id, id));

    return NextResponse.json({ message: "Deal deleted successfully" });
  } catch (error) {
    console.error("Error deleting deal:", error);
    return NextResponse.json(
      { message: "Failed to delete deal" },
      { status: 500 }
    );
  }
}
