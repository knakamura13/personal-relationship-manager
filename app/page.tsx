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
    refreshContacts,
    refreshLogs,
    refreshTags,
  } = useDataCache();

  // Show loading only on initial data fetch
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

  if (activeTab === "logs") {
    return (
      // Logs view
      <div className="px-4 py-6 pb-20">
        {/* Tab Navigation - centered */}
        <div className="container mx-auto max-w-4xl">
          <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg border border-border">
            <button
              onClick={() => setActiveTab("contacts")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
            >
              <Contact size={16} />
              Contacts
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-background text-foreground shadow-sm border border-border"
            >
              <BookOpen size={16} />
              Logs
            </button>
          </div>
        </div>

        {/* Logs Content - full width with centered content area */}
        <div className="container mx-auto max-w-4xl">
          <LogsView
            logs={logs}
            tags={tags}
            onLogsUpdate={refreshLogs}
            onTagsUpdate={refreshTags}
          />
        </div>
      </div>
    );
  }

  return (
    // Contacts view
    <div className="px-4 py-6 pb-20">
      <div className="container mx-auto max-w-4xl">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg border border-border">
          <button
            onClick={() => setActiveTab("contacts")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-background text-foreground shadow-sm border border-border"
          >
            <Contact size={16} />
            Contacts
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
          >
            <BookOpen size={16} />
            Logs
          </button>
        </div>

        {/* Content */}
        <ContactsView
          contacts={contacts}
          tags={tags}
          onContactsUpdate={refreshContacts}
          onTagsUpdate={refreshTags}
        />
      </div>
    </div>
  );
}
