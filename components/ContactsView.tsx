"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Tag, Clock, User } from "lucide-react";
import { fuzzySearch, formatDate } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function ContactsView() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "updated">("name");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    notes: "",
    tags: [] as string[],
  });

  // Load contacts and tags
  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts");
      const data = await response.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags");
      const data = await response.json();
      setTags(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      setTags([]);
    }
  };

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
        await fetchContacts();
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
        await fetchContacts();
      }
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", notes: "", tags: [] });
    setShowAddForm(false);
    setEditingContact(null);
  };

  const startEdit = (contact: Contact) => {
    setFormData({
      name: contact.name,
      notes: contact.notes,
      tags: contact.tags,
    });
    setEditingContact(contact);
    setShowAddForm(true);
  };

  const addTag = (tagName: string) => {
    if (tagName && !formData.tags.includes(tagName)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagName],
      }));
    }
  };

  const removeTag = (tagName: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagName),
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading contacts...</div>;
  }

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

            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs border border-primary/20"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-primary/70"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a tag..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
                />
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => addTag(tag.name)}
                      className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
      <div className="space-y-3">
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
                          className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary rounded-md text-xs border border-primary/20"
                        >
                          <Tag size={10} className="mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Updated {formatDate(new Date(contact.updatedAt))}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
