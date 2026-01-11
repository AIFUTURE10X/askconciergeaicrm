/**
 * Regenerate Draft API
 *
 * POST - Regenerate draft with different tone or feedback
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailDrafts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { regenerateDraft, type DraftTone } from "@/lib/ai/email-drafter";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { tone, feedback } = body;

    const draft = await db.query.emailDrafts.findFirst({
      where: eq(emailDrafts.id, id),
      with: { contact: true, deal: true },
    });

    if (!draft) {
      return NextResponse.json({ message: "Draft not found" }, { status: 404 });
    }

    // Mark as generating
    await db
      .update(emailDrafts)
      .set({ status: "generating", updatedAt: new Date() })
      .where(eq(emailDrafts.id, id));

    try {
      const newDraft = await regenerateDraft(
        {
          fromName: draft.originalFromName || "",
          fromEmail: draft.originalFromEmail,
          subject: draft.originalSubject || "",
          body: draft.originalBody || "",
          contactName: draft.contact?.name,
          companyName: draft.contact?.company || undefined,
          dealTitle: draft.deal?.title,
          dealStage: draft.deal?.stage,
        },
        (tone as DraftTone) || (draft.tone as DraftTone),
        draft.draftBody,
        feedback
      );

      const [updated] = await db
        .update(emailDrafts)
        .set({
          draftSubject: newDraft.subject,
          draftBody: newDraft.body,
          tone: tone || draft.tone,
          status: "pending",
          updatedAt: new Date(),
        })
        .where(eq(emailDrafts.id, id))
        .returning();

      return NextResponse.json({ draft: updated });
    } catch (aiError) {
      // Reset status on failure
      await db
        .update(emailDrafts)
        .set({ status: "pending", updatedAt: new Date() })
        .where(eq(emailDrafts.id, id));

      console.error("[Drafts API] AI regeneration failed:", aiError);
      return NextResponse.json(
        { message: "Failed to regenerate draft", error: String(aiError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Drafts API] Error regenerating draft:", error);
    return NextResponse.json(
      { message: "Failed to regenerate draft" },
      { status: 500 }
    );
  }
}
