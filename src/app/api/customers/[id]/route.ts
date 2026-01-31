import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { organizations } from "@/lib/db/schema/main-app-tables";
import { getOrganizationDetail } from "@/lib/admin/queries";
import { VALID_TIERS, VALID_STATUSES } from "@/lib/admin/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const org = await getOrganizationDetail(id);
    if (!org) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error("Error fetching customer detail:", error);
    return NextResponse.json(
      { message: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, ...data } = body;

    // Verify org exists
    const [existing] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (action === "changeTier") {
      if (!data.tier || !VALID_TIERS.includes(data.tier)) {
        return NextResponse.json(
          { message: `Invalid tier. Must be one of: ${VALID_TIERS.join(", ")}` },
          { status: 400 }
        );
      }
      await db
        .update(organizations)
        .set({ pricingTier: data.tier, updatedAt: new Date() })
        .where(eq(organizations.id, id));
      return NextResponse.json({ message: "Tier updated", tier: data.tier });
    }

    if (action === "extendTrial") {
      const days = parseInt(data.days);
      if (!days || days < 1 || days > 90) {
        return NextResponse.json(
          { message: "Days must be between 1 and 90" },
          { status: 400 }
        );
      }
      const [org] = await db
        .select({
          trialEndsAt: organizations.trialEndsAt,
          trialExtendedCount: organizations.trialExtendedCount,
        })
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      const baseDate = org.trialEndsAt || new Date();
      const newEnd = new Date(baseDate);
      newEnd.setDate(newEnd.getDate() + days);

      await db
        .update(organizations)
        .set({
          trialEndsAt: newEnd,
          trialExtendedCount: (org.trialExtendedCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, id));
      return NextResponse.json({
        message: "Trial extended",
        trialEndsAt: newEnd.toISOString(),
      });
    }

    if (action === "cancelSubscription") {
      await db
        .update(organizations)
        .set({ subscriptionStatus: "canceled", updatedAt: new Date() })
        .where(eq(organizations.id, id));
      return NextResponse.json({ message: "Subscription marked as canceled" });
    }

    if (action === "editDetails") {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (data.name !== undefined) {
        if (!data.name.trim()) {
          return NextResponse.json({ message: "Name cannot be empty" }, { status: 400 });
        }
        updates.name = data.name.trim();
      }
      if (data.phoneNumber !== undefined) {
        updates.phoneNumber = data.phoneNumber.trim() || null;
      }
      if (data.subscriptionStatus !== undefined) {
        if (!VALID_STATUSES.includes(data.subscriptionStatus)) {
          return NextResponse.json({ message: "Invalid status" }, { status: 400 });
        }
        updates.subscriptionStatus = data.subscriptionStatus;
      }
      await db
        .update(organizations)
        .set(updates)
        .where(eq(organizations.id, id));
      return NextResponse.json({ message: "Details updated" });
    }

    return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { message: "Failed to update customer" },
      { status: 500 }
    );
  }
}
