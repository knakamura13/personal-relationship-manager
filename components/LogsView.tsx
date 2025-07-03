"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Clock, BookOpen } from "lucide-react";
import { fuzzySearch, formatDate, formatDateForInput } from "@/lib/utils";

interface LogEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export default function LogsView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    date: formatDateForInput(new Date()),
  });

  // Load logs
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs");
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs (search and reverse chronological order)
  const filteredLogs = useMemo(() => {
    let filtered = logs.filter((log) => {
      const searchText = `${log.title} ${log.content}`;
      return fuzzySearch(searchQuery, searchText);
    });

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [logs, searchQuery]);

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
        await fetchLogs();
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
        await fetchLogs();
      }
    } catch (error) {
      console.error("Failed to delete log entry:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      date: formatDateForInput(new Date()),
    });
    setShowAddForm(false);
    setEditingLog(null);
  };

  const startEdit = (log: LogEntry) => {
    setFormData({
      title: log.title,
      content: log.content,
      date: formatDateForInput(new Date(log.date)),
    });
    setEditingLog(log);
    setShowAddForm(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading logs...</div>;
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
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          Add Log Entry
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
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

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {editingLog ? "Update" : "Add"} Entry
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-input text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              {editingLog && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingLog.id)}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors ml-auto"
                >
                  Delete Entry
                </button>
              )}
            </div>
          </form>
        </div>
      )}

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
              {filteredLogs.map((log) => (
                <div key={log.id}>
                  {/* Mobile/tablet layout (xl and below) - dates inside container */}
                  <div className="flex gap-6 hover:bg-muted/50 transition-colors rounded-lg xl:hidden">
                    <div className="flex-shrink-0 w-20 text-right mt-1">
                      <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                        {formatDate(new Date(log.date))}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => startEdit(log)}
                        className="text-left w-full group"
                      >
                        <h3 className="font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                          {log.title}
                        </h3>
                      </button>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock size={14} />
                        Updated {formatDate(new Date(log.updatedAt))}
                      </div>
                      {log.content && (
                        <div className="prose dark:prose-invert max-w-none mt-3">
                          <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                            {log.content}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Desktop layout (xl and up) - dates in left margin */}
                  <div className="hidden xl:block relative">
                    <div className="absolute -left-32 top-4 w-24 text-right">
                      <div className="text-sm font-medium text-muted-foreground whitespace-nowrap mt-1">
                        {formatDate(new Date(log.date))}
                      </div>
                    </div>

                    <div className="hover:bg-muted/50 transition-colors rounded-lg p-4 pl-0">
                      <button
                        onClick={() => startEdit(log)}
                        className="text-left w-full group"
                      >
                        <h3 className="font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                          {log.title}
                        </h3>
                      </button>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock size={14} />
                        Updated {formatDate(new Date(log.updatedAt))}
                      </div>
                      {log.content && (
                        <div className="prose dark:prose-invert max-w-none mt-3">
                          <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                            {log.content}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
