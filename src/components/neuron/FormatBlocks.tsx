import { useState } from "react";
import {
  Play, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight,
  Copy, Maximize2, Settings2
} from "lucide-react";
import { Block, BLOCK_TYPE_CONFIG, CodeLanguage, ExecutionStatus } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface FormatBlockProps {
  block: Block;
  onContentChange: (content: string) => void;
  onExecute: (blockId: string) => void;
  onLanguageChange?: (lang: CodeLanguage) => void;
}

const LANGUAGES: CodeLanguage[] = ["python", "javascript", "typescript", "sql", "bash", "rust", "go"];

const langColors: Record<CodeLanguage, string> = {
  python: "text-status-validated",
  javascript: "text-primary",
  typescript: "text-graph-highlight",
  sql: "text-ai-accent",
  bash: "text-muted-foreground",
  rust: "text-destructive",
  go: "text-status-validated",
};

const statusIcons: Record<ExecutionStatus, React.ElementType> = {
  idle: Play,
  running: Loader2,
  success: CheckCircle2,
  error: XCircle,
};

const statusColors: Record<ExecutionStatus, string> = {
  idle: "text-muted-foreground hover:text-primary",
  running: "text-primary animate-spin",
  success: "text-status-validated",
  error: "text-destructive",
};

function ExecutionBadge({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    passive: "bg-muted text-muted-foreground",
    validated: "bg-status-validated/15 text-status-validated",
    executable: "bg-primary/15 text-primary",
    automated: "bg-ai-accent/15 text-ai-accent",
  };
  return (
    <span className={cn("text-nano font-semibold uppercase px-1.5 py-0.5 rounded", colors[mode] || colors.passive)}>
      {mode}
    </span>
  );
}

function BlockHeader({ block, onExecute, onLanguageChange, children }: {
  block: Block; onExecute: () => void; onLanguageChange?: (lang: CodeLanguage) => void; children?: React.ReactNode;
}) {
  const cfg = BLOCK_TYPE_CONFIG[block.type];
  const StatusIcon = statusIcons[block.executionStatus || "idle"];
  const [showLangs, setShowLangs] = useState(false);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 border-b border-border rounded-t-md text-micro">
      <span className="font-semibold uppercase tracking-wider text-muted-foreground">{cfg.shortLabel}</span>

      {block.language && onLanguageChange && (
        <div className="relative">
          <button
            onClick={() => setShowLangs(!showLangs)}
            className={cn("flex items-center gap-0.5 font-mono font-medium", langColors[block.language])}
          >
            {block.language}
            <ChevronDown className="h-2.5 w-2.5" />
          </button>
          {showLangs && (
            <div className="absolute left-0 top-5 z-20 bg-popover border border-border rounded-md shadow-lg py-0.5 min-w-[100px]">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  onClick={() => { onLanguageChange(lang); setShowLangs(false); }}
                  className={cn(
                    "w-full text-left px-2.5 py-1 text-micro font-mono hover:bg-muted transition-colors",
                    lang === block.language && "text-primary font-semibold"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {children}

      <div className="flex-1" />

      <ExecutionBadge mode={block.executionMode || "passive"} />

      {cfg.executable && (
        <>
          <button
            onClick={onExecute}
            className={cn("p-0.5 rounded transition-colors", statusColors[block.executionStatus || "idle"])}
            title="Run block"
          >
            <StatusIcon className="h-3.5 w-3.5" />
          </button>
        </>
      )}

      <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-0.5">
        <Copy className="h-3 w-3" />
      </button>
      <button className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-0.5">
        <Maximize2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function ExecutionResult({ result, status }: { result?: string; status?: ExecutionStatus }) {
  if (!result || (status !== "success" && status !== "error")) return null;
  return (
    <div className={cn(
      "px-3 py-2 text-xs font-mono border-t border-border",
      status === "success" ? "bg-status-validated/5 text-status-validated" : "bg-destructive/5 text-destructive"
    )}>
      <div className="text-nano uppercase font-semibold mb-1 opacity-60">
        {status === "success" ? "Output" : "Error"}
      </div>
      <pre className="whitespace-pre-wrap">{result}</pre>
    </div>
  );
}

// Code Block
export function CodeBlock({ block, onContentChange, onExecute, onLanguageChange }: FormatBlockProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden bg-card">
      <BlockHeader block={block} onExecute={() => onExecute(block.id)} onLanguageChange={onLanguageChange} />
      <textarea
        value={block.content}
        onChange={(e) => onContentChange(e.target.value)}
        className="w-full px-3 py-2 font-mono text-sm bg-transparent border-none outline-none resize-none min-h-[60px] text-foreground"
        placeholder={`// Write ${block.language || "code"} here...`}
        rows={Math.max(3, block.content.split("\n").length)}
        spellCheck={false}
      />
      <ExecutionResult result={block.executionResult} status={block.executionStatus} />
    </div>
  );
}

// YAML Block
export function YamlBlock({ block, onContentChange, onExecute }: FormatBlockProps) {
  return (
    <div className="rounded-md border border-ai-border overflow-hidden bg-card">
      <BlockHeader block={block} onExecute={() => onExecute(block.id)}>
        <span className="text-ai-accent font-mono">.yml</span>
      </BlockHeader>
      <textarea
        value={block.content}
        onChange={(e) => onContentChange(e.target.value)}
        className="w-full px-3 py-2 font-mono text-sm bg-ai/20 border-none outline-none resize-none min-h-[60px] text-foreground"
        placeholder="# Define agent, pipeline, or config..."
        rows={Math.max(3, block.content.split("\n").length)}
        spellCheck={false}
      />
      <ExecutionResult result={block.executionResult} status={block.executionStatus} />
    </div>
  );
}

// JSON Block
export function JsonBlock({ block, onContentChange, onExecute }: FormatBlockProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden bg-card">
      <BlockHeader block={block} onExecute={() => onExecute(block.id)}>
        <span className="text-primary font-mono">.json</span>
      </BlockHeader>
      <textarea
        value={block.content}
        onChange={(e) => onContentChange(e.target.value)}
        className="w-full px-3 py-2 font-mono text-sm bg-transparent border-none outline-none resize-none min-h-[60px] text-foreground"
        placeholder='{ "key": "value" }'
        rows={Math.max(3, block.content.split("\n").length)}
        spellCheck={false}
      />
      <ExecutionResult result={block.executionResult} status={block.executionStatus} />
    </div>
  );
}

// Prompt Block
export function PromptBlock({ block, onContentChange, onExecute }: FormatBlockProps) {
  const sections = parsePromptSections(block.content);

  return (
    <div className="rounded-md border border-primary/20 overflow-hidden bg-card">
      <BlockHeader block={block} onExecute={() => onExecute(block.id)}>
        <span className="text-primary font-semibold">PROMPT</span>
      </BlockHeader>
      <div className="divide-y divide-border">
        {["ROLE", "INPUT", "INSTRUCTIONS", "OUTPUT"].map(section => (
          <div key={section} className="px-3 py-2">
            <div className="text-nano font-semibold uppercase tracking-wider text-primary/60 mb-1">{section}</div>
            <textarea
              value={sections[section] || ""}
              onChange={(e) => {
                const updated = { ...sections, [section]: e.target.value };
                onContentChange(serializePromptSections(updated));
              }}
              className="w-full text-sm bg-transparent border-none outline-none resize-none min-h-[24px] text-foreground"
              placeholder={`Define ${section.toLowerCase()}...`}
              rows={1}
            />
          </div>
        ))}
      </div>
      <ExecutionResult result={block.executionResult} status={block.executionStatus} />
    </div>
  );
}

// Dataset / Table Block
export function DatasetBlock({ block, onContentChange, onExecute }: FormatBlockProps) {
  const { t } = useTranslation("common");
  const rows = parseTableData(block.content);

  return (
    <div className="rounded-md border border-border overflow-hidden bg-card">
      <BlockHeader block={block} onExecute={() => onExecute(block.id)}>
        <span className="text-muted-foreground font-mono">table</span>
      </BlockHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          {rows.length > 0 && (
            <>
              <thead>
                <tr className="bg-muted/30">
                  {rows[0].map((cell, i) => (
                    <th key={i} className="px-3 py-1.5 text-left font-semibold text-muted-foreground border-b border-border">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-b border-border last:border-0 hover:bg-muted/20">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-1.5 font-mono">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>
      <div className="px-3 py-1.5 border-t border-border">
        <textarea
          value={block.content}
          onChange={(e) => onContentChange(e.target.value)}
          className="w-full font-mono text-micro bg-transparent border-none outline-none resize-none min-h-[30px] text-muted-foreground"
          placeholder={t("common:neuron_editor.csv_placeholder")}
          rows={2}
          spellCheck={false}
        />
      </div>
      <ExecutionResult result={block.executionResult} status={block.executionStatus} />
    </div>
  );
}

// Diagram Block
export function DiagramBlock({ block, onContentChange, onExecute }: FormatBlockProps) {
  const { t } = useTranslation("common");
  return (
    <div className="rounded-md border border-graph-highlight/20 overflow-hidden bg-card">
      <BlockHeader block={block} onExecute={() => onExecute(block.id)}>
        <span className="text-graph-highlight font-mono">mermaid</span>
      </BlockHeader>
      <div className="p-3 bg-muted/10 border-b border-border min-h-[60px] flex items-center justify-center">
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap text-center">
          {block.content || "graph TD\n  A[Start] --> B[End]"}
        </pre>
      </div>
      <textarea
        value={block.content}
        onChange={(e) => onContentChange(e.target.value)}
        className="w-full px-3 py-2 font-mono text-sm bg-transparent border-none outline-none resize-none min-h-[40px] text-foreground"
        placeholder={t("common:neuron_editor.diagram_placeholder")}
        rows={Math.max(2, block.content.split("\n").length)}
        spellCheck={false}
      />
      <ExecutionResult result={block.executionResult} status={block.executionStatus} />
    </div>
  );
}

// AI Action Block
export function AIActionBlock({ block, onContentChange, onExecute }: FormatBlockProps) {
  const { t } = useTranslation("common");
  return (
    <div className="rounded-md border border-ai-accent/30 overflow-hidden bg-ai/30">
      <BlockHeader block={block} onExecute={() => onExecute(block.id)}>
        <span className="text-ai-accent font-semibold flex items-center gap-1">
          AI Worker
        </span>
      </BlockHeader>
      <textarea
        value={block.content}
        onChange={(e) => onContentChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-transparent border-none outline-none resize-none min-h-[40px] text-foreground"
        placeholder={t("common:neuron_editor.ai_worker_placeholder")}
        rows={Math.max(2, block.content.split("\n").length)}
      />
      <ExecutionResult result={block.executionResult} status={block.executionStatus} />
    </div>
  );
}

// Helpers
function parsePromptSections(content: string): Record<string, string> {
  const sections: Record<string, string> = { ROLE: "", INPUT: "", INSTRUCTIONS: "", OUTPUT: "" };
  if (!content) return sections;
  const parts = content.split(/\n---\n/);
  const keys = ["ROLE", "INPUT", "INSTRUCTIONS", "OUTPUT"];
  parts.forEach((p, i) => { if (keys[i]) sections[keys[i]] = p; });
  return sections;
}

function serializePromptSections(sections: Record<string, string>): string {
  return ["ROLE", "INPUT", "INSTRUCTIONS", "OUTPUT"].map(k => sections[k] || "").join("\n---\n");
}

function parseTableData(content: string): string[][] {
  if (!content.trim()) return [];
  return content.trim().split("\n").map(row => row.split(",").map(c => c.trim()));
}
