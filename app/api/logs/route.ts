export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const logs = await prisma.logEntry.findMany({
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
        ? Array.from(
            new Set(
              tags
                .map((tag) => tag.toLowerCase().trim())
                .filter((tag) => tag)
            )
          )
        : [];

    const logEntry = await prisma.$transaction(async (tx) => {
      if (normalizedTags.length > 0) {
        await tx.tag.createMany({
          data: normalizedTags.map((tagName) => ({ name: tagName })),
          skipDuplicates: true,
        });
      }

      return tx.logEntry.create({
        data: {
          title: title.trim(),
          content: content?.trim() || "",
          date: date ? new Date(date) : new Date(),
          tags: JSON.stringify(normalizedTags),
        },
      });
    });

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
