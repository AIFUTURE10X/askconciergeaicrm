import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Re-open a closed deal
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get the existing deal
    const existingDeal = await db.query.deals.findFirst({
      where: eq(deals.id, id),
    });

    if (!existingDeal) {
      return NextResponse.json({ message: "Deal not found" }, { status: 404 });
    }

    // Verify deal is closed
    if (existingDeal.stage !== "closed_won" && existingDeal.stage !== "closed_lost") {
      return NextResponse.json(
        { message: "Deal is not closed" },
        { status: 400 }
      );
    }

    // Determine which stage to return to
    const targetStage = existingDeal.lastStage || "lead";

    // Re-open the deal
    const [updatedDeal] = await db
      .update(deals)
      .set({
        stage: targetStage,
        closedAt: null,
        lostReason: null,
        lastStage: null,
        probability: 10, // Reset to default probability
        updatedAt: new Date(),
      })
      .where(eq(deals.id, id))
      .returning();

    // Fetch with relations
    const dealWithContact = await db.query.deals.findFirst({
      where: eq(deals.id, id),
      with: { contact: true },
    });

    return NextResponse.json({
      deal: dealWithContact,
      message: `Deal re-opened and moved to ${targetStage}`,
    });
  } catch (error) {
    console.error("Error re-opening deal:", error);
    return NextResponse.json(
      { message: "Failed to re-open deal" },
      { status: 500 }
    );
  }
}
