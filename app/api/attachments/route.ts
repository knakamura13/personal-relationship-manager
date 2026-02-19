import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { attachmentStorageService } from "@/lib/attachment-storage";

// File size limit: 5MB to keep storage costs manageable
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Allowed file types
const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  // Archives
  "application/zip",
  "application/x-zip-compressed",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const contactId = formData.get("contactId") as string | null;
    const logEntryId = formData.get("logEntryId") as string | null;

    // Validation
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!contactId && !logEntryId) {
      return NextResponse.json(
        { error: "Either contactId or logEntryId must be provided" },
        { status: 400 }
      );
    }

    if (contactId && logEntryId) {
      return NextResponse.json(
        { error: "Cannot attach to both contact and log entry" },
        { status: 400 }
      );
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` },
        { status: 400 }
      );
    }

    // File type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storagePayload = await attachmentStorageService.storePayload({
      buffer,
    });

    // Verify the parent exists
    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });
      if (!contact) {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 }
        );
      }
    }

    if (logEntryId) {
      const logEntry = await prisma.logEntry.findUnique({
        where: { id: logEntryId },
      });
      if (!logEntry) {
        return NextResponse.json(
          { error: "Log entry not found" },
          { status: 404 }
        );
      }
    }

    // Create attachment
    const attachment = await prisma.attachment.create({
      data: {
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        data: storagePayload.data,
        storageProvider: storagePayload.storageProvider ?? null,
        storageReference: storagePayload.storageReference ?? null,
        storageUrl: storagePayload.storageUrl ?? null,
        contactId: contactId || null,
        logEntryId: logEntryId || null,
      },
    });

    // Return attachment metadata only to save bandwidth
    const { data, ...attachmentWithoutData } = attachment;

    return NextResponse.json(attachmentWithoutData, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const contactId = url.searchParams.get("contactId");
    const logEntryId = url.searchParams.get("logEntryId");

    if (!contactId && !logEntryId) {
      return NextResponse.json(
        { error: "Either contactId or logEntryId must be provided" },
        { status: 400 }
      );
    }

    const attachments = await prisma.attachment.findMany({
      where: {
        ...(contactId && { contactId }),
        ...(logEntryId && { logEntryId }),
      },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        size: true,
        createdAt: true,
        storageProvider: true,
        storageReference: true,
        storageUrl: true,
        // Exclude data field to save bandwidth
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}
