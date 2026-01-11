import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { desc, ilike, or } from "drizzle-orm";

// GET - List all contacts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let contactList;

    if (search) {
      contactList = await db.query.contacts.findMany({
        where: or(
          ilike(contacts.name, `%${search}%`),
          ilike(contacts.email, `%${search}%`),
          ilike(contacts.company, `%${search}%`)
        ),
        with: {
          deals: true,
        },
        orderBy: [desc(contacts.createdAt)],
      });
    } else {
      contactList = await db.query.contacts.findMany({
        with: {
          deals: true,
        },
        orderBy: [desc(contacts.createdAt)],
      });
    }

    return NextResponse.json({ contacts: contactList });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { message: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

// POST - Create a new contact
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      company,
      title,
      propertyType,
      website,
      linkedinUrl,
      notes,
      source,
      tags = [],
    } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    const [newContact] = await db
      .insert(contacts)
      .values({
        name,
        email,
        phone,
        company,
        title,
        propertyType,
        website,
        linkedinUrl,
        notes,
        source,
        tags,
      })
      .returning();

    return NextResponse.json(
      { contact: newContact, message: "Contact created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { message: "Failed to create contact" },
      { status: 500 }
    );
  }
}
