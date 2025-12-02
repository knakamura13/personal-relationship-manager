import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const contact = await prisma.contact.update({
      where: { id: params.id },
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

    return NextResponse.json({
      ...contact,
      tags: JSON.parse(contact.tags || "[]"),
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.contact.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
