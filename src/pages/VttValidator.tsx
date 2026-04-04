/**
 * Public VTT/SRT Validator & Cleaner
 * Free tool for SEO capture on "vtt file" traffic.
 * Validates, sanitizes, and previews subtitle files.
 */
import { useState, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  parseSubtitleFile,
  validateSubtitleFile,
  escapeForDisplay,
  type VttResult,
} from "@/lib/vtt-security";
import {
  FileText, Upload, CheckCircle2, AlertTriangle, XCircle,
  Clock, Hash, Type, Download, Shield, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function VttValidator() {
  const navigate = useNavigate();
  const [result, setResult] = useState<VttResult | null>(null);
  const [rawInput, setRawInput] = useState("");
  const [filename, setFilename] = useState("");

  const handlePaste = useCallback(() => {
    if (!rawInput.trim()) return;
    setResult(parseSubtitleFile(rawInput, filename || "input.vtt"));
  }, [rawInput, filename]);

  const handleFileDrop = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateSubtitleFile(file);
    if (!validation.valid) {
      setResult({ success: false, error: validation.error!, errorCode: "INVALID_FORMAT" });
      return;
    }

    setFilename(file.name);
    const text = await file.text();
    setRawInput(text);
    setResult(parseSubtitleFile(text, file.name));
  }, []);

  const handleDownloadClean = useCallback(() => {
    if (!result?.success) return;
    const cleanVtt = [
      "WEBVTT",
      "",
      ...result.cues.map((c, i) => {
        const fmt = (s: number) => {
          const h = Math.floor(s / 3600).toString().padStart(2, "0");
          const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
          const sec = Math.floor(s % 60).toString().padStart(2, "0");
          const ms = Math.round((s % 1) * 1000).toString().padStart(3, "0");
          return `${h}:${m}:${sec}.${ms}`;
        };
        return `${i + 1}\n${fmt(c.startTime)} --> ${fmt(c.endTime)}\n${escapeForDisplay(c.text)}\n`;
      }),
    ].join("\n");

    const blob = new Blob([cleanVtt], { type: "text/vtt;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename ? `clean-${filename}` : "clean-subtitles.vtt";
    a.click();
    URL.revokeObjectURL(url);
  }, [result, filename]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "VTT File Validator & Cleaner — AI-IDEI",
    description: "Free online tool to validate, clean, and sanitize WebVTT and SRT subtitle files. Detects errors, removes malicious content, and exports clean files.",
    url: "https://ai-idei.com/tools/vtt-validator",
    applicationCategory: "Utility",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    creator: { "@type": "Organization", name: "AI-IDEI" },
  };

  return (
    <PageTransition>
      <SEOHead
        title="VTT File Validator & Cleaner — Free Online Tool"
        description="Free online VTT and SRT subtitle validator. Check for errors, remove malicious content, clean timestamps, and download sanitized subtitle files."
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border bg-card">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
            <Badge variant="secondary" className="mb-4 text-xs gap-1">
              <Shield className="h-3 w-3" /> Free Tool
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold mb-3">
              VTT File Validator & Cleaner
            </h1>
            <p className="text-sm text-muted-foreground max-w-[50ch] mx-auto">
              Paste or upload a <code className="text-xs bg-muted px-1 py-0.5 rounded">.vtt</code> or{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">.srt</code> file. We'll validate timestamps,
              strip malicious content, and export a clean version.
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Input */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Input
                </h2>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".vtt,.srt"
                    className="hidden"
                    onChange={handleFileDrop}
                  />
                  <Button variant="outline" size="sm" className="text-xs gap-1 pointer-events-none">
                    <Upload className="h-3 w-3" /> Upload File
                  </Button>
                </label>
              </div>

              <Textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={`WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello, this is a subtitle.\n\n00:00:05.000 --> 00:00:08.000\nPaste your VTT or SRT content here.`}
                className="font-mono text-xs min-h-[180px] resize-y"
              />

              <Button onClick={handlePaste} className="gap-1.5 text-xs" disabled={!rawInput.trim()}>
                <Shield className="h-3.5 w-3.5" /> Validate & Clean
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card className={cn(
              "border",
              result.success ? "border-semantic-emerald/30" : "border-destructive/30"
            )}>
              <CardContent className="p-5 space-y-4">
                {result.success ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-semantic-emerald" />
                      <h2 className="text-sm font-semibold">Valid Subtitle File</h2>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: Hash, label: "Cues", value: result.stats.cueCount },
                        { icon: Type, label: "Words", value: result.stats.wordCount.toLocaleString() },
                        { icon: Clock, label: "Duration", value: `${Math.floor(result.stats.durationSeconds / 60)}:${(result.stats.durationSeconds % 60).toString().padStart(2, "0")}` },
                        { icon: FileText, label: "Format", value: result.format.toUpperCase() },
                      ].map(s => (
                        <div key={s.label} className="bg-muted/50 rounded-lg p-3 text-center">
                          <s.icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                          <p className="text-lg font-bold font-mono">{s.value}</p>
                          <p className="text-micro text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Warnings */}
                    {result.warnings.length > 0 && (
                      <div className="bg-semantic-amber/10 border border-semantic-amber/20 rounded-lg p-3">
                        <p className="text-xs font-medium text-semantic-amber flex items-center gap-1 mb-1">
                          <AlertTriangle className="h-3 w-3" /> {result.warnings.length} Warning{result.warnings.length > 1 ? "s" : ""}
                        </p>
                        <ul className="text-micro text-muted-foreground space-y-0.5">
                          {result.warnings.slice(0, 5).map((w, i) => <li key={i}>• {w}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Preview */}
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="bg-muted/30 px-3 py-2 text-micro font-mono text-muted-foreground">
                        Preview (first 10 cues)
                      </div>
                      <div className="p-3 max-h-[200px] overflow-y-auto space-y-1.5">
                        {result.cues.slice(0, 10).map(c => (
                          <div key={c.index} className="flex gap-3 text-xs">
                            <span className="text-muted-foreground font-mono shrink-0 w-24">
                              {Math.floor(c.startTime / 60)}:{Math.floor(c.startTime % 60).toString().padStart(2, "0")}
                            </span>
                            <span className="text-foreground">{c.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button size="sm" onClick={handleDownloadClean} className="text-xs gap-1">
                        <Download className="h-3 w-3" /> Download Clean VTT
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate("/auth")} className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" /> Process with AI →
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-destructive" />
                      <h2 className="text-sm font-semibold">Validation Failed</h2>
                    </div>
                    <div className="bg-destructive/5 rounded-lg p-4">
                      <p className="text-xs text-destructive font-medium mb-1">Error: {(result as import("@/lib/vtt-security").VttParseError).errorCode}</p>
                      <p className="text-xs text-muted-foreground">{(result as import("@/lib/vtt-security").VttParseError).error}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* SEO content */}
          <section className="prose prose-sm max-w-none text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">What is a VTT File?</h2>
            <p className="text-xs leading-relaxed">
              WebVTT (Web Video Text Tracks) is the standard format for displaying timed text in HTML5 video players.
              VTT files contain subtitle cues with timestamps and text content. Unlike plain text, VTT files support
              formatting tags — which makes them a potential vector for XSS attacks if not properly sanitized.
            </p>
            <h2 className="text-base font-semibold text-foreground mt-6">Why Validate VTT Files?</h2>
            <p className="text-xs leading-relaxed">
              Malformed timestamps crash video players. Injected HTML tags can execute scripts in browsers.
              Unicode obfuscation bypasses simple text filters. Our validator checks for all these threats
              and produces a clean, safe output file.
            </p>
            <h2 className="text-base font-semibold text-foreground mt-6">Security Checks Performed</h2>
            <ul className="text-xs space-y-1">
              <li>✓ Script injection detection (<code>&lt;script&gt;</code>, event handlers)</li>
              <li>✓ HTML tag stripping (prevents DOM manipulation)</li>
              <li>✓ Unicode obfuscation removal (zero-width characters)</li>
              <li>✓ Timestamp validation (prevents parser crashes)</li>
              <li>✓ File size limits (prevents memory exhaustion)</li>
              <li>✓ Encoding verification (UTF-8 only)</li>
            </ul>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
