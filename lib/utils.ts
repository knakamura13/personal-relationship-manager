import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Search utility for fuzzy matching
export function fuzzySearch(query: string, text: string): boolean {
  if (!query.trim()) return true;

  const normalizedQuery = query.toLowerCase().trim();
  const normalizedText = text.toLowerCase();

  // Check if all words in query exist in text
  const queryWords = normalizedQuery.split(/\s+/);
  return queryWords.every((word) => normalizedText.includes(word));
}

// Format date for display
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

// Format date for input
export function formatDateForInput(date: Date): string {
  return new Date(date).toISOString().split("T")[0];
}
