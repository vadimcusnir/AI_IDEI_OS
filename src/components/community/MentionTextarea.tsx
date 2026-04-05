import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

interface Suggestion {
  user_id: string;
  display_name: string;
}

export function MentionTextarea({ value, onChange, placeholder, rows = 4, className }: MentionTextareaProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) { setSuggestions([]); return; }
    const { data } = await supabase
      .from("profiles_public" as any)
      .select("user_id, display_name")
      .ilike("display_name", `%${query}%`)
      .limit(5);
    setSuggestions(data || []);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(newValue);

    // Detect @mention trigger
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setMentionStart(cursorPos - atMatch[0].length);
      setShowSuggestions(true);
      setSelectedIdx(0);
      searchUsers(atMatch[1]);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = (name: string) => {
    const before = value.slice(0, mentionStart);
    const after = value.slice(textareaRef.current?.selectionStart || mentionStart);
    const newValue = `${before}@${name.replace(/\s+/g, "_")} ${after}`;
    onChange(newValue);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(suggestions[selectedIdx].display_name);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 bottom-full mb-1 left-0 w-56 bg-popover border border-border rounded-md shadow-lg py-1">
          {suggestions.map((s, i) => (
            <button
              key={s.user_id}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors ${
                i === selectedIdx ? "bg-accent" : ""
              }`}
              onMouseDown={(e) => { e.preventDefault(); insertMention(s.display_name); }}
            >
              <span className="text-primary font-medium">@{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
