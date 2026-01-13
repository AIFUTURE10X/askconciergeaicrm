import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

// GET /api/tags - List all tags
export async function GET() {
  try {
    const allTags = await db
      .select()
      .from(tags)
      .orderBy(desc(tags.createdAt));

    return NextResponse.json({ tags: allTags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }

    const [newTag] = await db
      .insert(tags)
      .values({
        name: name.trim(),
        color: color || "gray",
      })
      .returning();

    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}
