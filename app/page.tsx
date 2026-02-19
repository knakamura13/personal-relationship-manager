"use client";

import { useState } from "react";
import { Contact, BookOpen } from "lucide-react";
import ContactsView from "@/components/ContactsView";
import LogsView from "@/components/LogsView";
import { useDataCache } from "@/lib/hooks";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"contacts" | "logs">("contacts");
  const {
    contacts,
    logs,
    tags,
    isLoading,
    error,
    refreshContacts,
    refreshLogs,
    refreshTags,
    refreshAll,
  } = useDataCache();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
          <div className="text-sm text-muted-foreground mt-1">
            Fetching your data
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-20">
      {error && (
        <div className="container mx-auto max-w-4xl mb-4">
          <div className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div>
              <div className="font-medium">We couldn&apos;t load some data.</div>
              <div className="text-destructive/80">
                Please retry or check your connection.
              </div>
            </div>
            <button
              onClick={refreshAll}
              className="shrink-0 rounded-md border border-destructive/40 bg-destructive text-destructive-foreground px-3 py-1 text-xs font-semibold hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-4xl">
        <div
          role="tablist"
          aria-label="Primary views"
          className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg border border-border"
        >
          <button
            id="contacts-tab"
            role="tab"
            aria-selected={activeTab === "contacts"}
            aria-controls="contacts-panel"
            tabIndex={activeTab === "contacts" ? 0 : -1}
            onClick={() => setActiveTab("contacts")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              activeTab === "contacts"
                ? "bg-background text-foreground shadow-sm border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
            }`}
          >
            <Contact size={16} />
            Contacts
          </button>
          <button
            id="logs-tab"
            role="tab"
            aria-selected={activeTab === "logs"}
            aria-controls="logs-panel"
            tabIndex={activeTab === "logs" ? 0 : -1}
            onClick={() => setActiveTab("logs")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              activeTab === "logs"
                ? "bg-background text-foreground shadow-sm border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
            }`}
          >
            <BookOpen size={16} />
            Logs
          </button>
        </div>

        <div
          id="contacts-panel"
          role="tabpanel"
          aria-labelledby="contacts-tab"
          hidden={activeTab !== "contacts"}
        >
          <ContactsView
            contacts={contacts}
            tags={tags}
            onContactsUpdate={refreshContacts}
            onTagsUpdate={refreshTags}
          />
        </div>

        <div
          id="logs-panel"
          role="tabpanel"
          aria-labelledby="logs-tab"
          hidden={activeTab !== "logs"}
        >
          <LogsView
            logs={logs}
            tags={tags}
            onLogsUpdate={refreshLogs}
            onTagsUpdate={refreshTags}
          />
        </div>
      </div>
    </div>
  );
}
