"use client";

import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  type MouseEvent,
} from "react";
import Image from "next/image";
import { Search, Plus, Clock, BookOpen, Tag, Paperclip, X } from "lucide-react";
import {
  fuzzySearch,
  formatDate,
  formatDateForInput,
  formatFileSize,
} from "@/lib/utils";
import TagInput from "./TagInput";
import AttachmentManager from "./AttachmentManager";

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface LogEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  attachments: Attachment[];
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface LogsViewProps {
  logs: LogEntry[];
  tags: Tag[];
  onLogsUpdate: () => Promise<void>;
  onTagsUpdate: () => Promise<void>;
}

export default function LogsView({
  logs,
  tags,
  onLogsUpdate,
  onTagsUpdate,
}: LogsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [shouldScrollToEdit, setShouldScrollToEdit] = useState(false);
  const activeCardRef = useRef<HTMLDivElement | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null
  );
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Form state
  const createEmptyForm = () => ({
    title: "",
    content: "",
    date: formatDateForInput(new Date()),
    tags: [] as string[],
  });

  const [formData, setFormData] = useState(createEmptyForm);

  // Filter logs (search and reverse chronological order)
  const filteredLogs = useMemo(() => {
    const normalizedActiveTag = activeTagFilter?.toLowerCase();

    let filtered = logs.filter((log) => {
      const searchText = `${log.title} ${log.content} ${log.tags.join(" ")}`;
      const matchesSearch = fuzzySearch(searchQuery, searchText);
      const matchesTag =
        !normalizedActiveTag ||
        log.tags.some((tag) => tag.toLowerCase() === normalizedActiveTag);

      return matchesSearch && matchesTag;
    });

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [logs, searchQuery, activeTagFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingLog ? `/api/logs/${editingLog.id}` : "/api/logs";
      const method = editingLog ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await onLogsUpdate();
        await onTagsUpdate();
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save log entry:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this log entry?")) return;

    try {
      const response = await fetch(`/api/logs/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await onLogsUpdate();
        resetForm(); // Close the edit form after successful deletion
      }
    } catch (error) {
      console.error("Failed to delete log entry:", error);
    }
  };

  const resetForm = () => {
    setFormData(createEmptyForm());
    setShowAddForm(false);
    setEditingLog(null);
    setShouldScrollToEdit(false);
    activeCardRef.current = null;
  };

  const startEdit = (log: LogEntry) => {
    setFormData({
      title: log.title,
      content: log.content,
      date: formatDateForInput(new Date(log.date)),
      tags: log.tags,
    });
    setEditingLog(log);
    setShowAddForm(false);
    setShouldScrollToEdit(true);
  };

  const addTag = (tagName: string) => {
    const normalizedTagName = tagName.toLowerCase().trim();
    if (
      normalizedTagName &&
      !formData.tags.some((tag) => tag.toLowerCase() === normalizedTagName)
    ) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, normalizedTagName],
      }));
    }
  };

  const removeTag = (tagName: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagName),
    }));
  };

  const handleTagClick = (
    tagName: string,
    event?: MouseEvent<HTMLButtonElement>
  ) => {
    event?.stopPropagation();
    const normalized = tagName.toLowerCase();
    setActiveTagFilter((prev) => (prev === normalized ? null : normalized));
    setShowAddForm(false);
    setEditingLog(null);
  };

  const handleAttachmentPreview = async (attachment: Attachment | null) => {
    if (!attachment || !attachment.mimeType.startsWith("image/")) {
      closeAttachmentPreview();
      return;
    }

    try {
      setPreviewAttachment(attachment);

      const response = await fetch(`/api/attachments/${attachment.id}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("LogsView: API error response:", errorText);
        throw new Error(
          `Failed to load image: ${response.status} ${errorText}`
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewImageUrl(url);
    } catch (error) {
      console.error("LogsView: Preview error:", error);
      closeAttachmentPreview();
    }
  };

  const closeAttachmentPreview = useCallback(() => {
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
    }
    setPreviewImageUrl(null);
    setPreviewAttachment(null);
  }, [previewImageUrl]);

  const handlePreviewModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeAttachmentPreview();
    }
  };

  // Handle keyboard events for preview modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && previewAttachment) {
        event.preventDefault();
        event.stopPropagation();
        closeAttachmentPreview();
      }
    };

    if (previewAttachment) {
      document.addEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = "unset";
    };
  }, [previewAttachment, closeAttachmentPreview]);

  // Cleanup preview image URL on unmount
  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  // Keep editing log in sync after attachments/log updates
  useEffect(() => {
    if (editingLog) {
      const updatedLog = logs.find((l) => l.id === editingLog.id);
      if (updatedLog) {
        setEditingLog(updatedLog);
      }
    }
  }, [logs, editingLog?.id, editingLog]);

  useEffect(() => {
    if (!shouldScrollToEdit || !editingLog) return;

    const rafId = requestAnimationFrame(() => {
      const targetElement = activeCardRef.current;
      if (!targetElement) {
        setShouldScrollToEdit(false);
        return;
      }

      const header = document.querySelector("header");
      const headerHeight = header
        ? Number(header.getBoundingClientRect().height) || 0
        : 0;

      const docStyle = getComputedStyle(document.documentElement);
      const scrollPaddingTop =
        parseFloat(docStyle.getPropertyValue("scroll-padding-top")) || 0;

      const gap = 8;
      const offset = Math.max(headerHeight, scrollPaddingTop) + gap;
      const topPosition =
        window.scrollY + targetElement.getBoundingClientRect().top - offset;

      window.scrollTo({
        top: Math.max(topPosition, 0),
        behavior: "smooth",
      });

      setShouldScrollToEdit(false);
    });

    return () => cancelAnimationFrame(rafId);
  }, [shouldScrollToEdit, editingLog]);

  const renderLogForm = (variant: "add" | "edit") => (
    <div
      className={`bg-card border border-border rounded-lg p-6 shadow-sm ${
        variant === "edit" ? "mt-4" : ""
      }`}
    >
      <h3 className="text-lg font-semibold mb-4">
        {editingLog ? "Edit Log Entry" : "Add New Log Entry"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Entry</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
            placeholder="Brief summary of this log entry..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, date: e.target.value }))
            }
            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Details (optional)
          </label>
          <textarea
            value={formData.content}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, content: e.target.value }))
            }
            rows={4}
            className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
            placeholder="Optional additional details or context..."
          />
        </div>

        <TagInput
          selectedTags={formData.tags}
          availableTags={tags}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          placeholder="Add a tag..."
        />

        {editingLog && (
          <AttachmentManager
            attachments={editingLog.attachments || []}
            logEntryId={editingLog.id}
            onAttachmentsUpdate={onLogsUpdate}
            onPreview={handleAttachmentPreview}
            key={editingLog.id}
          />
        )}

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Save Entry
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-3 sm:px-4 py-2 border border-input text-foreground rounded-lg hover:bg-accent transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Cancel
          </button>
          {editingLog && (
            <button
              type="button"
              onClick={() => handleDelete(editingLog.id)}
              className="px-3 sm:px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors ml-auto text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with search and controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-h-10 pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          {activeTagFilter && (
            <div className="mt-2 flex items-center gap-2 text-xs text-primary">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 border border-primary/20 rounded-md lowercase">
                <Tag size={10} />
                filtering by {activeTagFilter}
              </span>
              <button
                type="button"
                onClick={() => setActiveTagFilter(null)}
                className="text-muted-foreground hover:text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setEditingLog(null);
            setFormData(createEmptyForm());
            setShowAddForm(true);
            setShouldScrollToEdit(false);
            activeCardRef.current = null;
          }}
          className="flex items-center gap-2 px-4 py-2 h-10 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          Add Log Entry
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && renderLogForm("add")}

      {/* Logs List */}
      <div>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No log entries found</p>
            <p className="text-sm">
              {searchQuery
                ? "Try adjusting your search"
                : "Add your first log entry to get started"}
            </p>
          </div>
        ) : (
          <div className="xl:relative xl:-ml-32 xl:pl-32">
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const isEditing = editingLog?.id === log.id;

                return (
                  <div
                    key={log.id}
                    className={`bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-border/80 ${
                      isEditing ? "ring-1 ring-primary/40" : ""
                    }`}
                    ref={isEditing ? activeCardRef : undefined}
                  >
                    {/* Mobile/tablet layout (xl and below) */}
                    <div className="flex gap-6 xl:hidden">
                      <div className="flex-shrink-0 w-20 text-right mt-1">
                        <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                          {formatDate(new Date(log.date))}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => startEdit(log)}
                          className="text-left w-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
                        >
                          <h3 className="font-semibold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">
                            {log.title}
                          </h3>
                        </button>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            Updated {formatDate(new Date(log.updatedAt))}
                          </span>
                          {log.attachments && log.attachments.length > 0 && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Paperclip size={14} />
                              {log.attachments.length}
                            </span>
                          )}
                        </div>
                        {log.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {log.tags.map((tag) => {
                              const normalizedTag = tag.toLowerCase();
                              const isActive =
                                activeTagFilter === normalizedTag;

                              return (
                                <button
                                  type="button"
                                  key={tag}
                                  onClick={(e) => handleTagClick(tag, e)}
                                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs border lowercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                    isActive
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                  }`}
                                >
                                  <Tag size={10} className="mr-1" />
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {log.content && (
                          <div className="prose dark:prose-invert max-w-none mt-3">
                            <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                              {log.content}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop layout (xl and up) */}
                    <div className="hidden xl:block relative">
                      <div className="absolute -left-32 top-4 w-24 text-right">
                        <div className="text-sm font-medium text-muted-foreground whitespace-nowrap mt-1">
                          {formatDate(new Date(log.date))}
                        </div>
                      </div>

                      <div className="pl-0">
                        <button
                          onClick={() => startEdit(log)}
                          className="text-left w-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
                        >
                          <h3 className="font-semibold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">
                            {log.title}
                          </h3>
                        </button>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            Updated {formatDate(new Date(log.updatedAt))}
                          </span>
                          {log.attachments && log.attachments.length > 0 && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Paperclip size={14} />
                              {log.attachments.length}
                            </span>
                          )}
                        </div>
                        {log.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {log.tags.map((tag) => {
                              const normalizedTag = tag.toLowerCase();
                              const isActive =
                                activeTagFilter === normalizedTag;

                              return (
                                <button
                                  type="button"
                                  key={tag}
                                  onClick={(e) => handleTagClick(tag, e)}
                                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs border lowercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                    isActive
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                  }`}
                                >
                                  <Tag size={10} className="mr-1" />
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {log.content && (
                          <div className="prose dark:prose-invert max-w-none mt-3">
                            <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                              {log.content}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditing && renderLogForm("edit")}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={handlePreviewModalClick}
        >
          <div className="relative max-w-4xl max-h-full">
            {previewImageUrl ? (
              <Image
                src={previewImageUrl}
                alt={previewAttachment.filename}
                fill
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex items-center justify-center w-64 h-64 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <div className="text-sm text-muted-foreground">
                    Loading image...
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={closeAttachmentPreview}
              className="absolute -top-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              title="Close"
              aria-label="Close preview"
            >
              <X size={16} />
            </button>
            {previewImageUrl && (
              <div className="absolute -bottom-2 left-0 right-0 bg-black/60 text-white text-center py-2 px-4 rounded-b-lg">
                <div className="text-sm font-medium">
                  {previewAttachment.filename}
                </div>
                <div className="text-xs opacity-80">
                  {formatFileSize(previewAttachment.size)} •{" "}
                  {new Date(previewAttachment.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
