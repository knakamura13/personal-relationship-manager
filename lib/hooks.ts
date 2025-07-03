import { useState, useEffect, useCallback } from "react";

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

interface CachedData {
  contacts: Contact[];
  logs: LogEntry[];
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
}

export function useDataCache() {
  const [data, setData] = useState<CachedData>({
    contacts: [],
    logs: [],
    tags: [],
    isLoading: true,
    error: null,
  });

  const fetchContacts = useCallback(async () => {
    try {
      const response = await fetch("/api/contacts");
      const contacts = await response.json();
      setData((prev) => ({
        ...prev,
        contacts: Array.isArray(contacts) ? contacts : [],
      }));
      return contacts;
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      setData((prev) => ({
        ...prev,
        error: "Failed to fetch contacts",
      }));
      return [];
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch("/api/logs");
      const logs = await response.json();
      setData((prev) => ({
        ...prev,
        logs: Array.isArray(logs) ? logs : [],
      }));
      return logs;
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setData((prev) => ({
        ...prev,
        error: "Failed to fetch logs",
      }));
      return [];
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch("/api/tags");
      const tags = await response.json();
      setData((prev) => ({
        ...prev,
        tags: Array.isArray(tags) ? tags : [],
      }));
      return tags;
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      setData((prev) => ({
        ...prev,
        error: "Failed to fetch tags",
      }));
      return [];
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await Promise.all([fetchContacts(), fetchLogs(), fetchTags()]);
    } finally {
      setData((prev) => ({ ...prev, isLoading: false }));
    }
  }, [fetchContacts, fetchLogs, fetchTags]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refreshContacts = useCallback(async () => {
    await fetchContacts();
  }, [fetchContacts]);

  const refreshLogs = useCallback(async () => {
    await fetchLogs();
  }, [fetchLogs]);

  const refreshTags = useCallback(async () => {
    await fetchTags();
  }, [fetchTags]);

  return {
    ...data,
    refreshContacts,
    refreshLogs,
    refreshTags,
    refreshAll: fetchAllData,
  };
}
