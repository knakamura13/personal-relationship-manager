import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { attachmentStorageService } from "@/lib/attachment-storage";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: params.id },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    const buffer = await attachmentStorageService.readPayload({
      data: attachment.data,
      storageProvider: attachment.storageProvider,
      storageReference: attachment.storageReference,
      storageUrl: attachment.storageUrl,
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.filename}"`,
        "Content-Length": attachment.size.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading attachment:", error);
    return NextResponse.json(
      { error: "Failed to download attachment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: params.id },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    await attachmentStorageService.deletePayload({
      data: attachment.data,
      storageProvider: attachment.storageProvider,
      storageReference: attachment.storageReference,
      storageUrl: attachment.storageUrl,
    });

    await prisma.attachment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
