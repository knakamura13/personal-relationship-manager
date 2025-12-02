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

  const fetchContacts = useCallback(async (clearError = true) => {
    try {
      const response = await fetch("/api/contacts");
      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.status}`);
      }

      const contacts = await response.json();
      setData((prev) => ({
        ...prev,
        contacts: Array.isArray(contacts) ? contacts : [],
        error: clearError ? null : prev.error,
      }));
      return true;
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      setData((prev) => ({
        ...prev,
        error: "Failed to fetch contacts",
      }));
      return false;
    }
  }, []);

  const fetchLogs = useCallback(async (clearError = true) => {
    try {
      const response = await fetch("/api/logs");
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status}`);
      }

      const logs = await response.json();
      setData((prev) => ({
        ...prev,
        logs: Array.isArray(logs) ? logs : [],
        error: clearError ? null : prev.error,
      }));
      return true;
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setData((prev) => ({
        ...prev,
        error: "Failed to fetch logs",
      }));
      return false;
    }
  }, []);

  const fetchTags = useCallback(async (clearError = true) => {
    try {
      const response = await fetch("/api/tags");
      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.status}`);
      }

      const tags = await response.json();
      setData((prev) => ({
        ...prev,
        tags: Array.isArray(tags) ? tags : [],
        error: clearError ? null : prev.error,
      }));
      return true;
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      setData((prev) => ({
        ...prev,
        error: "Failed to fetch tags",
      }));
      return false;
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const [contactsSuccess, logsSuccess, tagsSuccess] = await Promise.all([
        fetchContacts(false),
        fetchLogs(false),
        fetchTags(false),
      ]);

      if (contactsSuccess && logsSuccess && tagsSuccess) {
        setData((prev) => ({ ...prev, error: null }));
      }
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
