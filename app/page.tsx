"use client";

import { useState } from "react";
import { Contact, BookOpen } from "lucide-react";
import ContactsView from "@/components/ContactsView";
import LogsView from "@/components/LogsView";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"contacts" | "logs">("contacts");

  if (activeTab === "logs") {
    return (
      <div className="px-4 py-6">
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
          <LogsView />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
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
        <ContactsView />
      </div>
    </div>
  );
}
