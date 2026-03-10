import React from "react";

export function DocsMarkdownRenderer({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCode = false;
  let codeBlock = "";
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = (key: string) => {
    if (tableRows.length === 0) return null;
    const el = (
      <div key={key} className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {tableRows[0]?.map((cell, ci) => (
                <th key={ci} className="text-left p-2 border-b border-border font-semibold text-xs">{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="p-2 border-b border-border/50 text-xs text-muted-foreground">{cell}</td>
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

  const renderInline = (line: string) =>
    line.split(/(\*\*.*?\*\*|`[^`]+`)/g).map((part, pi) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={pi} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={pi} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
      return part;
    });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCode) {
        elements.push(
          <pre key={`code-${i}`} className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto my-4">
            <code>{codeBlock.trim()}</code>
          </pre>
        );
        codeBlock = "";
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeBlock += line + "\n"; continue; }

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

    if (line.trim() === "") {
      elements.push(<div key={`space-${i}`} className="h-3" />);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={`h2-${i}`} className="text-xl font-semibold mt-8 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={`h3-${i}`} className="text-base font-semibold mt-6 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith("- **")) {
      const match = line.match(/^- \*\*(.+?)\*\*\s*[—-]\s*(.+)$/);
      if (match) {
        elements.push(
          <li key={`li-${i}`} className="text-sm text-muted-foreground ml-4 mb-1.5 list-disc">
            <span className="font-medium text-foreground">{match[1]}</span> — {match[2]}
          </li>
        );
      } else {
        const boldMatch = line.match(/^- \*\*(.+?)\*\*(.*)$/);
        elements.push(
          <li key={`li-${i}`} className="text-sm text-muted-foreground ml-4 mb-1.5 list-disc">
            <span className="font-medium text-foreground">{boldMatch?.[1] || line.slice(2)}</span>
            {boldMatch?.[2] || ""}
          </li>
        );
      }
    } else if (line.startsWith("- ")) {
      elements.push(
        <li key={`li-${i}`} className="text-sm text-muted-foreground ml-4 mb-1.5 list-disc">{renderInline(line.slice(2))}</li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const text = line.replace(/^\d+\.\s/, "");
      const boldMatch = text.match(/\*\*(.+?)\*\*\s*[—-]\s*(.+)/);
      elements.push(
        <li key={`li-${i}`} className="text-sm text-muted-foreground ml-4 mb-1.5 list-decimal">
          {boldMatch ? (<><span className="font-medium text-foreground">{boldMatch[1]}</span> — {boldMatch[2]}</>) : renderInline(text)}
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

  return <>{elements}</>;
}
