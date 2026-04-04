/**
 * Viral Distribution Engine — ShareableOutput
 * Transforms every service output into a distribution asset with embedded CTAs.
 */
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, Copy, Check, Twitter, Linkedin, MessageCircle,
  ExternalLink, Download, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Content Classification ───
type ContentCategory = "viral_short" | "authority_long" | "educational" | "utility_tool";

function classifyContent(text: string, serviceKey: string): ContentCategory {
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 100) return "viral_short";
  if (serviceKey.includes("analysis") || serviceKey.includes("audit")) return "authority_long";
  if (serviceKey.includes("course") || serviceKey.includes("guide")) return "educational";
  return "utility_tool";
}

// ─── CTA Embedding ───
function generateShareText(content: string, category: ContentCategory): string {
  const hook = content.slice(0, 200).trim();
  const cta = "\n\n🧠 Generat cu AI-IDEI → https://ai-idei-os.lovable.app";

  switch (category) {
    case "viral_short":
      return `${hook}...${cta}`;
    case "authority_long":
      return `📊 Analiză generată cu AI:\n\n${hook}...${cta}`;
    case "educational":
      return `📚 Insight extras automat:\n\n${hook}...${cta}`;
    default:
      return `⚡ ${hook}...${cta}`;
  }
}

// ─── Platform Mapping ───
function getShareUrl(platform: string, text: string, url?: string): string {
  const encoded = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url || "https://ai-idei-os.lovable.app");

  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encoded}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encoded}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encoded}`;
    default:
      return "#";
  }
}

interface ShareableOutputProps {
  content: string;
  serviceKey: string;
  serviceName: string;
  className?: string;
}

export function ShareableOutput({ content, serviceKey, serviceName, className }: ShareableOutputProps) {
  const { t } = useTranslation("common");
  const [copied, setCopied] = useState(false);

  const category = useMemo(() => classifyContent(content, serviceKey), [content, serviceKey]);
  const shareText = useMemo(() => generateShareText(content, category), [content, category]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success(t("share.copied", { defaultValue: "Copiat cu CTA inclus!" }));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("share.copy_failed", { defaultValue: "Nu s-a putut copia" }));
    }
  };

  const handleShare = (platform: string) => {
    const url = getShareUrl(platform, shareText);
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${serviceKey}-output.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("share.downloaded", { defaultValue: "Descărcat!" }));
  };

  const platforms = [
    { key: "twitter", label: "Twitter / X", icon: Twitter },
    { key: "linkedin", label: "LinkedIn", icon: Linkedin },
    { key: "telegram", label: "Telegram", icon: MessageCircle },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={cn("mt-4", className)}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {/* Copy with CTA */}
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 h-7"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied
            ? t("share.copied_btn", { defaultValue: "Copiat!" })
            : t("share.copy_with_cta", { defaultValue: "Copiază + CTA" })}
        </Button>

        {/* Share dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-7">
              <Share2 className="h-3 w-3" />
              {t("share.share", { defaultValue: "Distribuie" })}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            {platforms.map(p => (
              <DropdownMenuItem
                key={p.key}
                onClick={() => handleShare(p.key)}
                className="gap-2 text-xs cursor-pointer"
              >
                <p.icon className="h-3.5 w-3.5" />
                {p.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDownload} className="gap-2 text-xs cursor-pointer">
              <Download className="h-3.5 w-3.5" />
              {t("share.download_md", { defaultValue: "Descarcă .md" })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Viral badge */}
        {category === "viral_short" && (
          <span className="inline-flex items-center gap-1 text-nano font-mono text-primary bg-primary/10 rounded px-1.5 py-0.5">
            <Sparkles className="h-2.5 w-2.5" />
            {t("share.viral_ready", { defaultValue: "Viral-ready" })}
          </span>
        )}
      </div>

      {/* Distribution hint */}
      <p className="text-micro text-muted-foreground mt-1.5">
        {t("share.cta_embedded", {
          defaultValue: "CTA-ul către AI-IDEI este inclus automat în fiecare share",
        })}
      </p>
    </motion.div>
  );
}
