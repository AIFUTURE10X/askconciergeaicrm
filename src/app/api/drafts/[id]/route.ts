/**
 * Single Draft API
 *
 * GET - Get draft by ID
 * PATCH - Update draft (edit content, change status, approve, reject)
 * DELETE - Delete draft
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailDrafts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const draft = await db.query.emailDrafts.findFirst({
      where: eq(emailDrafts.id, id),
      with: { contact: true, deal: true },
    });

    if (!draft) {
      return NextResponse.json({ message: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("[Drafts API] Error fetching draft:", error);
    return NextResponse.json(
      { message: "Failed to fetch draft" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { draftSubject, draftBody, tone, status } = body;

    const existing = await db.query.emailDrafts.findFirst({
      where: eq(emailDrafts.id, id),
    });

    if (!existing) {
      return NextResponse.json({ message: "Draft not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (draftSubject !== undefined) updateData.draftSubject = draftSubject;
    if (draftBody !== undefined) updateData.draftBody = draftBody;
    if (tone !== undefined) updateData.tone = tone;
    if (status !== undefined) updateData.status = status;

    const [updated] = await db
      .update(emailDrafts)
      .set(updateData)
      .where(eq(emailDrafts.id, id))
      .returning();

    return NextResponse.json({ draft: updated });
  } catch (error) {
    console.error("[Drafts API] Error updating draft:", error);
    return NextResponse.json(
      { message: "Failed to update draft" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await db.delete(emailDrafts).where(eq(emailDrafts.id, id));
    return NextResponse.json({ message: "Draft deleted" });
  } catch (error) {
    console.error("[Drafts API] Error deleting draft:", error);
    return NextResponse.json(
      { message: "Failed to delete draft" },
      { status: 500 }
    );
  }
}
