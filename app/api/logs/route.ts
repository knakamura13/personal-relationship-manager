import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const logs = await prisma.logEntry.findMany({
      orderBy: {
        date: "desc",
      },
    });

    // Parse tags from JSON string
    const logsWithParsedTags = logs.map((log) => ({
      ...log,
      tags: JSON.parse(log.tags || "[]"),
    }));

    return NextResponse.json(logsWithParsedTags);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const logEntry = await prisma.logEntry.create({
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

    return NextResponse.json(
      {
        ...logEntry,
        tags: JSON.parse(logEntry.tags || "[]"),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating log entry:", error);
    return NextResponse.json(
      { error: "Failed to create log entry" },
      { status: 500 }
    );
  }
}
