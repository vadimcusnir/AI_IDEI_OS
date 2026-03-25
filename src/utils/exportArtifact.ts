/**
 * P2-011: Export artifacts as Markdown, plain text, or HTML
 */

interface ExportableArtifact {
  title: string;
  content: string;
  artifact_type?: string;
  tags?: string[];
  created_at?: string;
}

export function exportAsMarkdown(artifact: ExportableArtifact): string {
  const header = [
    `# ${artifact.title}`,
    "",
    `**Type:** ${artifact.artifact_type || "general"}`,
    artifact.tags?.length ? `**Tags:** ${artifact.tags.join(", ")}` : "",
    artifact.created_at ? `**Date:** ${new Date(artifact.created_at).toLocaleDateString("ro-RO")}` : "",
    "",
    "---",
    "",
  ].filter(Boolean).join("\n");

  return header + artifact.content;
}

export function exportAsPlainText(artifact: ExportableArtifact): string {
  // Strip markdown formatting
  const plain = artifact.content
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, (match) => match.replace(/`/g, ""))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*+]\s/gm, "• ");

  return `${artifact.title}\n${"=".repeat(artifact.title.length)}\n\n${plain}`;
}

export function exportAsHtml(artifact: ExportableArtifact): string {
  // Basic markdown to HTML
  let html = artifact.content
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>${artifact.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; }
    h1, h2, h3 { color: #111; }
    .meta { color: #666; font-size: 0.875rem; margin-bottom: 1.5rem; }
  </style>
</head>
<body>
  <h1>${artifact.title}</h1>
  <div class="meta">
    ${artifact.artifact_type ? `<span>Type: ${artifact.artifact_type}</span>` : ""}
    ${artifact.created_at ? `<span> • ${new Date(artifact.created_at).toLocaleDateString("ro-RO")}</span>` : ""}
  </div>
  <div><p>${html}</p></div>
</body>
</html>`;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportArtifact(artifact: ExportableArtifact, format: "md" | "txt" | "html") {
  const slug = artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);

  switch (format) {
    case "md":
      downloadFile(exportAsMarkdown(artifact), `${slug}.md`, "text/markdown");
      break;
    case "txt":
      downloadFile(exportAsPlainText(artifact), `${slug}.txt`, "text/plain");
      break;
    case "html":
      downloadFile(exportAsHtml(artifact), `${slug}.html`, "text/html");
      break;
  }
}
