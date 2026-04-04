import React from "react";

export function DocsMarkdownRenderer({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCode = false;
  let codeBlock = "";
  let codeLang = "";
  let inTable = false;
  let tableRows: string[][] = [];
  let inBlockquote = false;
  let blockquoteLines: string[] = [];

  const flushBlockquote = (key: string) => {
    if (blockquoteLines.length === 0) return null;
    const el = (
      <blockquote
        key={key}
        className="border-l-2 border-primary/40 pl-4 my-4 py-1"
      >
        {blockquoteLines.map((line, i) => (
          <p key={i} className="text-sm text-muted-foreground italic leading-relaxed">
            {renderInline(line)}
          </p>
        ))}
      </blockquote>
    );
    blockquoteLines = [];
    inBlockquote = false;
    return el;
  };

  const flushTable = (key: string) => {
    if (tableRows.length === 0) return null;
    const el = (
      <div key={key} className="overflow-x-auto my-4 rounded-lg border border-border">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50">
              {tableRows[0]?.map((cell, ci) => (
                <th key={ci} className="text-left p-2.5 border-b border-border font-semibold text-xs text-foreground">
                  {renderInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, ri) => (
              <tr key={ri} className="hover:bg-muted/30 transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className="p-2.5 border-b border-border/50 text-xs text-muted-foreground">
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
    return el;
  };

  const renderInline = (line: string): React.ReactNode[] =>
    line.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*|`[^`]+`)/g).map((part, pi) => {
      // Links: [text](url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return (
          <a
            key={pi}
            href={linkMatch[2]}
            className="text-primary hover:underline underline-offset-2 transition-colors"
          >
            {linkMatch[1]}
          </a>
        );
      }
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={pi} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={pi} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground/80">{part.slice(1, -1)}</code>;
      return part;
    });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith("```")) {
      if (inCode) {
        elements.push(
          <div key={`code-${i}`} className="my-4 rounded-lg overflow-hidden border border-border">
            {codeLang && (
              <div className="bg-muted/80 px-3 py-1 text-micro font-mono text-muted-foreground uppercase tracking-wider border-b border-border">
                {codeLang}
              </div>
            )}
            <pre className="bg-muted/50 p-4 text-xs font-mono overflow-x-auto">
              <code>{codeBlock.trim()}</code>
            </pre>
          </div>
        );
        codeBlock = "";
        codeLang = "";
        inCode = false;
      } else {
        codeLang = line.slice(3).trim();
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeBlock += line + "\n"; continue; }

    // Blockquotes
    if (line.startsWith("> ")) {
      blockquoteLines.push(line.slice(2));
      inBlockquote = true;
      continue;
    } else if (inBlockquote) {
      const bqEl = flushBlockquote(`bq-${i}`);
      if (bqEl) elements.push(bqEl);
    }

    // Tables
    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) continue;
      tableRows.push(cells);
      inTable = true;
      continue;
    } else if (inTable) {
      const tableEl = flushTable(`table-${i}`);
      if (tableEl) elements.push(tableEl);
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-border" />);
      continue;
    }

    if (line.trim() === "") {
      elements.push(<div key={`space-${i}`} className="h-3" />);
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-xl font-semibold mt-8 mb-3 text-foreground">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-semibold mt-6 mb-2 text-foreground">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- **")) {
      const match = line.match(/^- \*\*(.+?)\*\*\s*[—-]\s*(.+)$/);
      if (match) {
        elements.push(
          <li key={`li-${i}`} className="text-sm text-muted-foreground ml-4 mb-1.5 list-disc">
            <span className="font-medium text-foreground">{match[1]}</span> — {renderInline(match[2])}
          </li>
        );
      } else {
        const boldMatch = line.match(/^- \*\*(.+?)\*\*(.*)$/);
        elements.push(
          <li key={`li-${i}`} className="text-sm text-muted-foreground ml-4 mb-1.5 list-disc">
            <span className="font-medium text-foreground">{boldMatch?.[1] || line.slice(2)}</span>
            {boldMatch?.[2] ? renderInline(boldMatch[2]) : ""}
          </li>
        );
      }
    } else if (line.startsWith("  - ") || line.startsWith("   - ")) {
      // Nested list items
      elements.push(
        <li key={`li-${i}`} className="text-sm text-muted-foreground ml-8 mb-1 list-[circle]">
          {renderInline(line.replace(/^\s+- /, ""))}
        </li>
      );
    } else if (line.startsWith("- ")) {
      elements.push(
        <li key={`li-${i}`} className="text-sm text-muted-foreground ml-4 mb-1.5 list-disc">{renderInline(line.slice(2))}</li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const text = line.replace(/^\d+\.\s/, "");
      const boldMatch = text.match(/\*\*(.+?)\*\*\s*[—-]\s*(.+)/);
      elements.push(
        <li key={`li-${i}`} className="text-sm text-muted-foreground ml-4 mb-1.5 list-decimal">
          {boldMatch ? (<><span className="font-medium text-foreground">{boldMatch[1]}</span> — {renderInline(boldMatch[2])}</>) : renderInline(text)}
        </li>
      );
    } else {
      elements.push(
        <p key={`p-${i}`} className="text-sm text-muted-foreground leading-relaxed max-w-[65ch]">{renderInline(line)}</p>
      );
    }
  }

  if (inTable) {
    const tableEl = flushTable("table-final");
    if (tableEl) elements.push(tableEl);
  }
  if (inBlockquote) {
    const bqEl = flushBlockquote("bq-final");
    if (bqEl) elements.push(bqEl);
  }

  return <>{elements}</>;
}
