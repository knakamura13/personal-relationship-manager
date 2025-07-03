"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Tag,
  Clock,
  User,
  Upload,
  X,
  Paperclip,
} from "lucide-react";
import { fuzzySearch, formatDate, compressImageToBase64 } from "@/lib/utils";

import TagInput from "./TagInput";
import AttachmentManager from "./AttachmentManager";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface Contact {
  id: string;
  name: string;
  notes: string;
  tags: string[];
  avatar?: string | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ContactsViewProps {
  contacts: Contact[];
  tags: Tag[];
  onContactsUpdate: () => Promise<void>;
  onTagsUpdate: () => Promise<void>;
}

export default function ContactsView({
  contacts,
  tags,
  onContactsUpdate,
  onTagsUpdate,
}: ContactsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "updated">("name");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Debug logging for form state changes
  useEffect(() => {
    console.log("showAddForm changed to:", showAddForm);
  }, [showAddForm]);

  useEffect(() => {
    console.log("editingContact changed to:", editingContact?.id || null);
  }, [editingContact]);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null
  );
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    notes: "",
    tags: [] as string[],
    avatar: null as string | null,
  });

  // Filter and sort contacts
  const filteredAndSortedContacts = useMemo(() => {
    let filtered = contacts.filter((contact) => {
      const searchText = `${contact.name} ${contact.notes} ${contact.tags.join(
        " "
      )}`;
      return fuzzySearch(searchQuery, searchText);
    });

    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
    });
  }, [contacts, searchQuery, sortBy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingContact
        ? `/api/contacts/${editingContact.id}`
        : "/api/contacts";
      const method = editingContact ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await onContactsUpdate();
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save contact:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await onContactsUpdate();
        resetForm(); // Close the edit form after successful deletion
      }
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  };

  const resetForm = () => {
    console.log("resetForm called - closing edit form");
    console.trace("Stack trace for resetForm call:");
    setFormData({ name: "", notes: "", tags: [], avatar: null });
    setShowAddForm(false);
    setEditingContact(null);
  };

  const startEdit = (contact: Contact) => {
    setFormData({
      name: contact.name,
      notes: contact.notes,
      tags: contact.tags,
      avatar: contact.avatar || null,
    });
    setEditingContact(contact);
    setShowAddForm(true);
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImageToBase64(file);
      setFormData((prev) => ({
        ...prev,
        avatar: compressedBase64,
      }));
    } catch (error) {
      console.error("Failed to process image:", error);
    }
  };

  const removeAvatar = () => {
    setFormData((prev) => ({
      ...prev,
      avatar: null,
    }));
  };

  const openAvatarModal = () => {
    if (formData.avatar) {
      setShowAvatarModal(true);
    }
  };

  const closeAvatarModal = () => {
    setShowAvatarModal(false);
  };

  const handleAttachmentPreview = async (attachment: Attachment | null) => {
    console.log("handleAttachmentPreview called with:", attachment);

    if (!attachment || !attachment.mimeType.startsWith("image/")) {
      console.log("Invalid attachment or not an image");
      closeAttachmentPreview();
      return;
    }

    try {
      console.log("Setting preview attachment:", attachment.id);
      setPreviewAttachment(attachment);

      console.log("Fetching attachment from API...");
      const response = await fetch(`/api/attachments/${attachment.id}`);
      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(
          `Failed to load image: ${response.status} ${errorText}`
        );
      }

      const blob = await response.blob();
      console.log("Got blob, creating URL...");
      const url = URL.createObjectURL(blob);
      console.log("Setting preview image URL:", url);
      setPreviewImageUrl(url);
    } catch (error) {
      console.error("Preview error:", error);
      closeAttachmentPreview();
    }
  };

  const closeAttachmentPreview = () => {
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
    }
    setPreviewImageUrl(null);
    setPreviewAttachment(null);
  };

  const handlePreviewModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeAttachmentPreview();
    }
  };

  const triggerFileUpload = () => {
    const fileInput = document.getElementById(
      "avatar-upload"
    ) as HTMLInputElement;
    fileInput?.click();
  };

  // Handle keyboard events for modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (previewAttachment) {
          event.preventDefault();
          event.stopPropagation();
          closeAttachmentPreview();
        } else if (showAvatarModal) {
          closeAvatarModal();
        }
      }
    };

    if (previewAttachment || showAvatarModal) {
      document.addEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = "unset";
    };
  }, [showAvatarModal, previewAttachment]);

  // Cleanup preview image URL on unmount
  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  return (
    <div className="space-y-6">
      {/* Header with search and controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 max-h-10 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto h-10 justify-between">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "updated")}
            className="pl-3 pr-10 py-2 border border-input rounded-lg bg-background text-sm appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 0.5rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.5em 1.5em",
            }}
          >
            <option value="name">Sort by Name</option>
            <option value="updated">Sort by Updated</option>
          </select>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus size={16} />
            Add Contact
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {editingContact ? "Edit Contact" : "Add New Contact"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Avatar</label>
              <div className="flex items-center gap-4">
                {formData.avatar ? (
                  <div className="relative">
                    <img
                      src={formData.avatar}
                      alt="Avatar preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={openAvatarModal}
                      title="Click to view full size"
                    />
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors group"
                    onClick={triggerFileUpload}
                    title="Click to upload photo"
                  >
                    <User
                      size={24}
                      className="text-muted-foreground group-hover:text-muted-foreground/80"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                    multiple
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex items-center gap-2 px-3 py-2 border border-input rounded-lg bg-background hover:bg-accent transition-colors cursor-pointer text-sm"
                  >
                    <Upload size={16} />
                    {formData.avatar ? "Change Photo" : "Upload Photo"}
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, GIF up to 10MB. Will be resized to 1200px.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Add any notes about this contact..."
              />
            </div>

            <TagInput
              selectedTags={formData.tags}
              availableTags={tags}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              placeholder="Add a tag..."
            />

            {editingContact && (
              <AttachmentManager
                attachments={editingContact.attachments || []}
                contactId={editingContact.id}
                onAttachmentsUpdate={onContactsUpdate}
                onPreview={handleAttachmentPreview}
                key={editingContact.id} // Force re-render when editing different contact
              />
            )}

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                Save Contact
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-3 sm:px-4 py-2 border border-input text-foreground rounded-lg hover:bg-accent transition-colors text-sm"
              >
                Cancel
              </button>
              {editingContact && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingContact.id)}
                  className="px-3 sm:px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors ml-auto text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Contacts List */}
      <div className="space-y-4">
        {filteredAndSortedContacts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <User size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No contacts found</p>
            <p className="text-sm">
              {searchQuery
                ? "Try adjusting your search"
                : "Add your first contact to get started"}
            </p>
          </div>
        ) : (
          filteredAndSortedContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-border/80"
            >
              <button
                onClick={() => startEdit(contact)}
                className="text-left w-full group"
              >
                <div className="flex items-start gap-3">
                  {contact.avatar ? (
                    <img
                      src={contact.avatar}
                      alt={`${contact.name}'s avatar`}
                      className="w-12 h-12 rounded-full object-cover border-2 border-border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted border-2 border-border flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-card-foreground truncate group-hover:text-primary transition-colors">
                      {contact.name}
                    </h3>
                    {contact.notes && (
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                        {contact.notes}
                      </p>
                    )}
                    {contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {contact.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded-md text-xs border border-primary/20 lowercase"
                          >
                            <Tag size={10} className="mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Updated {formatDate(new Date(contact.updatedAt))}
                      </span>
                      {contact.attachments &&
                        contact.attachments.length > 0 && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Paperclip size={12} />
                            {contact.attachments.length}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Avatar Modal */}
      {showAvatarModal && formData.avatar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeAvatarModal}
        >
          <div className="relative max-w-3xl max-h-full">
            <img
              src={formData.avatar}
              alt="Avatar full size"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeAvatarModal}
              className="absolute -top-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={handlePreviewModalClick}
        >
          <div className="relative max-w-4xl max-h-full">
            {previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt={previewAttachment.filename}
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
              className="absolute -top-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
              title="Close"
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
