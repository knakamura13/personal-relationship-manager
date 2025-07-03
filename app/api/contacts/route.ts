import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Parse tags from JSON string
    const contactsWithParsedTags = contacts.map((contact) => ({
      ...contact,
      tags: JSON.parse(contact.tags || "[]"),
    }));

    return NextResponse.json(contactsWithParsedTags);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, notes, tags } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        name: name.trim(),
        notes: notes || "",
        tags: JSON.stringify(tags || []),
      },
    });

    // Update tags table with new tags
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        await prisma.tag.upsert({
          where: { name: tagName },
          create: { name: tagName },
          update: {},
        });
      }
    }

    return NextResponse.json(
      {
        ...contact,
        tags: JSON.parse(contact.tags || "[]"),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
