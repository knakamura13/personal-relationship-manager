import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, content, date, tags } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Normalize tags to lowercase
    const normalizedTags =
      tags && Array.isArray(tags)
        ? tags.map((tag) => tag.toLowerCase().trim()).filter((tag) => tag)
        : [];

    const logEntry = await prisma.logEntry.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        content: content?.trim() || "",
        date: date ? new Date(date) : new Date(),
        tags: JSON.stringify(normalizedTags),
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
      ...logEntry,
      tags: JSON.parse(logEntry.tags || "[]"),
    });
  } catch (error) {
    console.error("Error updating log entry:", error);
    return NextResponse.json(
      { error: "Failed to update log entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.logEntry.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting log entry:", error);
    return NextResponse.json(
      { error: "Failed to delete log entry" },
      { status: 500 }
    );
  }
}
