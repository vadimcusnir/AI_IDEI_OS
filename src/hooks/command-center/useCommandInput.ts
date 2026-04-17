/**
 * useCommandInput — Input state, file handling, slash commands.
 * Slash-commands are stored as non-editable tags (chips), not raw text.
 */
import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { validateFiles, validateInput } from "@/services/chatFileService";
import { saveDraft, restoreDraft, clearDraft } from "@/services/chatSessionService";
import { type CommandInputZoneRef } from "@/components/command-center/CommandInputZone";

export function useCommandInput(initialQuery = "") {
  const { t } = useTranslation(["common", "errors", "pages"]);
  const [input, setInput] = useState(initialQuery || restoreDraft());
  const [files, setFiles] = useState<File[]>([]);
  const [commands, setCommands] = useState<string[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const inputZoneRef = useRef<CommandInputZoneRef>(null);

  const validate = useCallback(() => {
    const hasContent = input.trim().length > 0 || files.length > 0 || commands.length > 0;
    if (!hasContent) {
      toast.error(t("errors:empty_input", { defaultValue: "Add a command, prompt, or file" }));
      return false;
    }
    if (input.trim().length > 0) {
      const inputValidation = validateInput(input.trim());
      if (!inputValidation.valid) {
        toast.error(t(inputValidation.errorKey!, { defaultValue: inputValidation.errorDefault }));
        return false;
      }
    }
    const fileValidation = validateFiles(files);
    if (!fileValidation.valid) {
      toast.error(t(fileValidation.errorKey!, { defaultValue: fileValidation.errorDefault }));
      return false;
    }
    return true;
  }, [input, files, commands, t]);

  const consumeInput = useCallback(() => {
    const raw = input.trim();
    const cmdPrefix = commands.length > 0 ? commands.join(" ") + " " : "";
    const finalPrompt = (cmdPrefix + raw).trim();
    setInput("");
    setFiles([]);
    setCommands([]);
    clearDraft();
    return finalPrompt;
  }, [input, commands]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => {
        const combined = [...prev, ...newFiles];
        if (combined.length > 10) {
          toast.error(t("errors:too_many_files", { defaultValue: "Maximum 10 files allowed" }));
          return prev;
        }
        return combined;
      });
    }
  }, [t]);

  const handleRemoveFile = useCallback((idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleRemoveCommand = useCallback((idx: number) => {
    setCommands(prev => prev.filter((_, i) => i !== idx));
  }, []);

  /**
   * Slash-menu selection now adds command as a non-editable tag
   * (instead of injecting raw text into the textarea).
   */
  const onSlashSelect = useCallback((cmd: string) => {
    const clean = cmd.trim();
    if (!clean) return;
    setCommands(prev => {
      if (prev.includes(clean)) return prev;
      if (prev.length >= 5) {
        toast.error(t("errors:too_many_commands", { defaultValue: "Maximum 5 commands per message" }));
        return prev;
      }
      return [...prev, clean];
    });
    inputZoneRef.current?.focus();
  }, [t]);

  return {
    input, setInput, files, setFiles,
    commands, setCommands, handleRemoveCommand,
    showSlashMenu, setShowSlashMenu,
    inputZoneRef,
    validate, consumeInput,
    handleFileSelect, handleRemoveFile, onSlashSelect,
    saveDraft, t,
  };
}
