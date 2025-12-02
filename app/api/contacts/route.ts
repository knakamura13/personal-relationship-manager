import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      include: {
        attachments: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            size: true,
            createdAt: true,
            // Exclude data field to save bandwidth
          },
        },
      },
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
    const { name, notes, tags, avatar } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Normalize tags to lowercase
    const normalizedTags =
      tags && Array.isArray(tags)
        ? Array.from(
            new Set(
              tags
                .map((tag) => tag.toLowerCase().trim())
                .filter((tag) => tag)
            )
          )
        : [];

    const contact = await prisma.contact.create({
      data: {
        name: name.trim(),
        notes: notes || "",
        tags: JSON.stringify(normalizedTags),
        avatar: avatar || null,
      },
    });

    // Update tags table with new tags
    for (const tagName of normalizedTags) {
      await prisma.tag.upsert({
        where: { name: tagName },
        create: { name: tagName },
        update: {},
      });
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
