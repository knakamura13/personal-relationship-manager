import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    // Convert base64 back to binary
    const buffer = Buffer.from(attachment.data, "base64");

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
