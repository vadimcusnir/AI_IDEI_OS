export type BlockType =
  | "text" | "heading" | "subheading"
  | "todo" | "quote" | "list"
  | "code" | "yaml" | "json" | "prompt"
  | "dataset" | "diagram" | "idea" | "reference"
  | "divider" | "ai-action" | "markdown";

export type ExecutionMode = "passive" | "validated" | "executable" | "automated";
export type ExecutionStatus = "idle" | "running" | "success" | "error";

export type CodeLanguage = "python" | "javascript" | "typescript" | "sql" | "bash" | "rust" | "go";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  language?: CodeLanguage;
  executionMode?: ExecutionMode;
  executionStatus?: ExecutionStatus;
  executionResult?: string;
  metadata?: Record<string, string>;
}

export interface ExecutionLog {
  id: string;
  blockId: string;
  blockType: BlockType;
  action: string;
  status: ExecutionStatus;
  result?: string;
  timestamp: string;
}

export const BLOCK_TYPE_CONFIG: Record<BlockType, {
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  category: "content" | "code" | "ai" | "structure";
  executable: boolean;
  defaultExecutionMode: ExecutionMode;
}> = {
  text: { label: "Text", shortLabel: "Txt", icon: "type", description: "Plain text block", category: "content", executable: false, defaultExecutionMode: "passive" },
  heading: { label: "Heading", shortLabel: "H1", icon: "heading", description: "Section heading", category: "structure", executable: false, defaultExecutionMode: "passive" },
  subheading: { label: "Subheading", shortLabel: "H2", icon: "heading-2", description: "Subsection heading", category: "structure", executable: false, defaultExecutionMode: "passive" },
  markdown: { label: "Markdown", shortLabel: "MD", icon: "file-text", description: "Rich markdown content", category: "content", executable: false, defaultExecutionMode: "passive" },
  todo: { label: "Todo", shortLabel: "Todo", icon: "check-square", description: "Task item", category: "content", executable: false, defaultExecutionMode: "passive" },
  quote: { label: "Quote", shortLabel: "Qte", icon: "quote", description: "Blockquote", category: "content", executable: false, defaultExecutionMode: "passive" },
  list: { label: "List", shortLabel: "List", icon: "list", description: "Bullet or numbered list", category: "content", executable: false, defaultExecutionMode: "passive" },
  idea: { label: "Idea", shortLabel: "Idea", icon: "lightbulb", description: "Idea capture block", category: "content", executable: false, defaultExecutionMode: "passive" },
  reference: { label: "Reference", shortLabel: "Ref", icon: "book-open", description: "Citation or source", category: "content", executable: false, defaultExecutionMode: "passive" },
  divider: { label: "Divider", shortLabel: "---", icon: "minus", description: "Section divider", category: "structure", executable: false, defaultExecutionMode: "passive" },
  code: { label: "Code", shortLabel: "Code", icon: "code", description: "Executable code block", category: "code", executable: true, defaultExecutionMode: "executable" },
  yaml: { label: "YAML", shortLabel: "YAML", icon: "file-cog", description: "Pipeline / agent definition", category: "code", executable: true, defaultExecutionMode: "executable" },
  json: { label: "JSON", shortLabel: "JSON", icon: "braces", description: "Data structure / API payload", category: "code", executable: true, defaultExecutionMode: "validated" },
  prompt: { label: "Prompt", shortLabel: "Prmt", icon: "message-square", description: "AI prompt template", category: "ai", executable: true, defaultExecutionMode: "executable" },
  dataset: { label: "Dataset", shortLabel: "Data", icon: "table", description: "Structured data table", category: "ai", executable: true, defaultExecutionMode: "validated" },
  diagram: { label: "Diagram", shortLabel: "Diag", icon: "git-branch", description: "Mermaid / flow diagram", category: "ai", executable: true, defaultExecutionMode: "validated" },
  "ai-action": { label: "AI Action", shortLabel: "AI", icon: "sparkles", description: "AI worker execution block", category: "ai", executable: true, defaultExecutionMode: "automated" },
};

export const SLASH_COMMAND_ORDER: BlockType[] = [
  "text", "heading", "subheading", "markdown",
  "todo", "quote", "list", "idea", "reference",
  "divider",
  "code", "yaml", "json",
  "prompt", "dataset", "diagram", "ai-action",
];
