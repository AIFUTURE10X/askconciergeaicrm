import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// DELETE /api/tags/[id] - Delete a tag
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deletedTag] = await db
      .delete(tags)
      .where(eq(tags.id, id))
      .returning();

    if (!deletedTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}

// PATCH /api/tags/[id] - Update a tag
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, color } = body;

    const updateData: { name?: string; color?: string } = {};
    if (name?.trim()) updateData.name = name.trim();
    if (color) updateData.color = color;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const [updatedTag] = await db
      .update(tags)
      .set(updateData)
      .where(eq(tags.id, id))
      .returning();

    if (!updatedTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}
