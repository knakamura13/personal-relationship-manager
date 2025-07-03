import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const logs = await prisma.logEntry.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(logs);
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
    const { title, content, date } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const logEntry = await prisma.logEntry.create({
      data: {
        title: title.trim(),
        content: content?.trim() || "",
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(logEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating log entry:", error);
    return NextResponse.json(
      { error: "Failed to create log entry" },
      { status: 500 }
    );
  }
}
