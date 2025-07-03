"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagInputProps {
  selectedTags: string[];
  availableTags: Tag[];
  onAddTag: (tagName: string) => void;
  onRemoveTag: (tagName: string) => void;
  placeholder?: string;
}

export default function TagInput({
  selectedTags,
  availableTags,
  onAddTag,
  onRemoveTag,
  placeholder = "Add a tag...",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter available tags based on input, case insensitive
  const filteredTags = availableTags.filter((tag) => {
    const normalizedInput = inputValue.toLowerCase().trim();
    const normalizedTagName = tag.name.toLowerCase();
    
    return (
      normalizedInput &&
      normalizedTagName.includes(normalizedInput) &&
      !selectedTags.some(selectedTag => selectedTag.toLowerCase() === normalizedTagName)
    );
  });

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowDropdown(value.trim().length > 0);
    setHighlightedIndex(-1);
  };

  // Handle adding a tag
  const handleAddTag = (tagName: string) => {
    const normalizedTagName = tagName.toLowerCase().trim();
    if (normalizedTagName && !selectedTags.some(tag => tag.toLowerCase() === normalizedTagName)) {
      onAddTag(normalizedTagName);
      setInputValue("");
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  // Handle key presses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredTags.length) {
        // Select highlighted tag
        handleAddTag(filteredTags[highlightedIndex].name);
      } else if (inputValue.trim()) {
        // Add new tag
        handleAddTag(inputValue.trim());
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredTags.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        inputRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Tags</label>
      
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs border border-primary/20 lowercase"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="hover:text-primary/70 flex-shrink-0"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      {/* Input field with dropdown */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim()) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className="flex-1 w-full px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent text-sm lowercase placeholder:normal-case"
        />

        {/* Dropdown with suggestions */}
        {showDropdown && filteredTags.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredTags.map((tag, index) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleAddTag(tag.name)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors lowercase ${
                  index === highlightedIndex ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Available tags (quick select) */}
      {availableTags.length > 0 && !showDropdown && (
        <div className="flex flex-wrap gap-1 mt-2">
          {availableTags
            .filter(tag => !selectedTags.some(selectedTag => selectedTag.toLowerCase() === tag.name.toLowerCase()))
            .slice(0, 10) // Limit to prevent UI overflow
            .map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleAddTag(tag.name)}
                className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs hover:bg-accent hover:text-accent-foreground transition-colors lowercase"
              >
                {tag.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
} 