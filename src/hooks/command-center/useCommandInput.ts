/**
 * useCommandInput — Input state, file handling, slash commands.
 * Extracted from useCommandCenter for SOC.
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
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const inputZoneRef = useRef<CommandInputZoneRef>(null);

  const validate = useCallback(() => {
    const inputValidation = validateInput(input.trim());
    if (!inputValidation.valid) {
      toast.error(t(inputValidation.errorKey!, { defaultValue: inputValidation.errorDefault }));
      return false;
    }
    const fileValidation = validateFiles(files);
    if (!fileValidation.valid) {
      toast.error(t(fileValidation.errorKey!, { defaultValue: fileValidation.errorDefault }));
      return false;
    }
    return true;
  }, [input, files, t]);

  const consumeInput = useCallback(() => {
    const raw = input.trim();
    setInput("");
    setFiles([]);
    clearDraft();
    return raw;
  }, [input]);

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

  const onSlashSelect = useCallback((cmd: string) => {
    setInput(cmd);
    inputZoneRef.current?.focus();
  }, []);

  return {
    input, setInput, files, setFiles,
    showSlashMenu, setShowSlashMenu,
    inputZoneRef,
    validate, consumeInput,
    handleFileSelect, handleRemoveFile, onSlashSelect,
    saveDraft, t,
  };
}
