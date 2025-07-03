"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  Download,
  File,
  Image,
  FileText,
  Archive,
} from "lucide-react";

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface AttachmentManagerProps {
  attachments: Attachment[];
  contactId?: string;
  logEntryId?: string;
  onAttachmentsUpdate: () => Promise<void>;
}

export default function AttachmentManager({
  attachments,
  contactId,
  logEntryId,
  onAttachmentsUpdate,
}: AttachmentManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null
  );
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview image URL on unmount
  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <Image size={16} className="text-blue-500" />;
    } else if (mimeType === "application/pdf") {
      return <FileText size={16} className="text-red-500" />;
    } else if (
      mimeType.includes("application/msword") ||
      mimeType.includes("wordprocessingml") ||
      mimeType.includes("excel") ||
      mimeType.includes("spreadsheetml")
    ) {
      return <FileText size={16} className="text-blue-600" />;
    } else if (mimeType.includes("zip")) {
      return <Archive size={16} className="text-gray-500" />;
    } else {
      return <File size={16} className="text-gray-500" />;
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        if (contactId) formData.append("contactId", contactId);
        if (logEntryId) formData.append("logEntryId", logEntryId);

        const response = await fetch("/api/attachments", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`${file.name}: ${error.error || "Upload failed"}`);
        }

        return file.name;
      });

      await Promise.all(uploadPromises);
      await onAttachmentsUpdate();

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await fetch(`/api/attachments/${attachment.id}`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      await onAttachmentsUpdate();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handlePreview = async (attachment: Attachment) => {
    if (!attachment.mimeType.startsWith("image/")) return;

    try {
      const response = await fetch(`/api/attachments/${attachment.id}`);
      if (!response.ok) throw new Error("Failed to load image");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewImageUrl(url);
      setPreviewAttachment(attachment);
    } catch (error) {
      console.error("Preview error:", error);
    }
  };

  const closePreview = () => {
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
    }
    setPreviewImageUrl(null);
    setPreviewAttachment(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div>
        <label className="block text-sm font-medium mb-2">Attachments</label>

        {/* Upload Button */}
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
            multiple
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-3 py-2 border border-input rounded-lg bg-background hover:bg-accent transition-colors cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={16} />
            {isUploading ? "Uploading..." : "Upload Files"}
          </button>
          <span className="text-xs text-muted-foreground">
            Images, PDFs, Word, Excel, Text, ZIP files up to 5MB
          </span>
        </div>

        {/* Upload Error */}
        {uploadError && (
          <div className="mt-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2">
            {uploadError}
          </div>
        )}
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Attached Files ({attachments.length})
          </div>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handlePreview(attachment)}
                    className={`${
                      attachment.mimeType.startsWith("image/")
                        ? "cursor-pointer hover:opacity-80 transition-opacity"
                        : "cursor-default"
                    }`}
                    disabled={!attachment.mimeType.startsWith("image/")}
                    title={
                      attachment.mimeType.startsWith("image/")
                        ? "Click to preview"
                        : ""
                    }
                  >
                    {getFileIcon(attachment.mimeType)}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {attachment.filename}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)} •{" "}
                      {new Date(attachment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="p-1 hover:bg-destructive/10 text-destructive hover:text-destructive rounded transition-colors"
                    title="Delete"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewAttachment && previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closePreview}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewImageUrl}
              alt={previewAttachment.filename}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closePreview}
              className="absolute -top-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
              title="Close"
            >
              <X size={16} />
            </button>
            <div className="absolute -bottom-2 left-0 right-0 bg-black/60 text-white text-center py-2 px-4 rounded-b-lg">
              <div className="text-sm font-medium">
                {previewAttachment.filename}
              </div>
              <div className="text-xs opacity-80">
                {formatFileSize(previewAttachment.size)} •{" "}
                {new Date(previewAttachment.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
