/**
 * Expanded Viral Distribution Panel
 * Full distribution UI: content variants, platform-specific sharing, tracking.
 */
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, Copy, Check, Download, Sparkles,
  ChevronDown, ChevronUp, ExternalLink,
  MessageCircle, Globe, Zap,
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
import { useContentDistribution, type DistributionChannel, type ContentVariant } from "@/hooks/useContentDistribution";

// ─── Platform metadata ───
const PLATFORMS: Record<DistributionChannel, { label: string; icon: string; color: string }> = {
  twitter: { label: "Twitter / X", icon: "𝕏", color: "text-foreground" },
  linkedin: { label: "LinkedIn", icon: "in", color: "text-blue-600" },
  telegram: { label: "Telegram", icon: "✈", color: "text-sky-500" },
  tiktok: { label: "TikTok", icon: "♪", color: "text-foreground" },
  instagram: { label: "Instagram", icon: "📸", color: "text-pink-500" },
  youtube: { label: "YouTube", icon: "▶", color: "text-red-500" },
  blog: { label: "Blog", icon: "📝", color: "text-foreground" },
  newsletter: { label: "Newsletter", icon: "📧", color: "text-foreground" },
  reddit: { label: "Reddit", icon: "🔗", color: "text-orange-500" },
};

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  viral_short: { label: "Viral Short", emoji: "🔥" },
  authority_long: { label: "Authority Content", emoji: "📊" },
  educational: { label: "Educational", emoji: "📚" },
  controversial: { label: "Controversial", emoji: "⚡" },
  utility_tool: { label: "Utility", emoji: "🛠" },
};

function getShareUrl(platform: DistributionChannel, text: string): string {
  const encoded = encodeURIComponent(text);
  const url = encodeURIComponent("https://ai-idei-os.lovable.app");
  switch (platform) {
    case "twitter": return `https://twitter.com/intent/tweet?text=${encoded}`;
    case "linkedin": return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    case "telegram": return `https://t.me/share/url?url=${url}&text=${encoded}`;
    case "reddit": return `https://reddit.com/submit?title=${encoded}&url=${url}`;
    default: return "#";
  }
}

interface DistributionPanelProps {
  content: string;
  serviceKey: string;
  serviceName: string;
  className?: string;
}

export function DistributionPanel({ content, serviceKey, serviceName, className }: DistributionPanelProps) {
  const { t } = useTranslation("common");
  const { plan, trackShare } = useContentDistribution(content, serviceKey);
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeVariantType, setActiveVariantType] = useState<string>("hook");

  const categoryInfo = CATEGORY_LABELS[plan.category] || CATEGORY_LABELS.utility_tool;

  const variantsByType = useMemo(() => {
    const grouped: Record<string, ContentVariant[]> = {};
    plan.variants.forEach(v => {
      if (!grouped[v.type]) grouped[v.type] = [];
      grouped[v.type].push(v);
    });
    return grouped;
  }, [plan.variants]);

  const variantTypes = Object.keys(variantsByType);

  const handleCopy = async (text: string, platform: DistributionChannel) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(platform);
      trackShare(platform, text);
      toast.success(t("share.copied", { defaultValue: "Copiat cu CTA inclus!" }));
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error(t("share.copy_failed", { defaultValue: "Nu s-a putut copia" }));
    }
  };

  const handlePlatformShare = (platform: DistributionChannel) => {
    const variant = plan.variants.find(v => v.platform === platform) || plan.variants[0];
    if (!variant) return;
    const url = getShareUrl(platform, variant.text);
    if (url !== "#") window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
    trackShare(platform, variant.text);
  };

  const handleDownload = () => {
    const allVariants = plan.variants.map((v, i) =>
      `## Variant ${i + 1} — ${v.type} (${v.platform})\n\n${v.text}\n\n---`
    ).join("\n\n");

    const full = `# Distribution Pack: ${serviceName}\n\nCategory: ${categoryInfo.emoji} ${categoryInfo.label}\nChannels: ${plan.channels.join(", ")}\n\n---\n\n${allVariants}`;

    const blob = new Blob([full], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `distribution-${serviceKey}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("share.downloaded", { defaultValue: "Distribution pack descărcat!" }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={cn("mt-5", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Share2 className="h-3 w-3 text-primary" />
          {t("distribution.title", { defaultValue: "Distribuie & crește" })}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-nano font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            {categoryInfo.emoji} {categoryInfo.label}
          </span>
          <span className="text-nano text-muted-foreground">
            {plan.variants.length} {t("distribution.variants", { defaultValue: "variante" })}
          </span>
        </div>
      </div>

      {/* Quick Share Row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        {plan.channels.map(channel => {
          const info = PLATFORMS[channel];
          return (
            <Button
              key={channel}
              variant="outline"
              size="sm"
              className="text-xs gap-1 h-7 px-2"
              onClick={() => handlePlatformShare(channel)}
            >
              <span className={cn("text-sm", info.color)}>{info.icon}</span>
              {info.label}
            </Button>
          );
        })}
        <Button variant="outline" size="sm" className="text-xs gap-1 h-7" onClick={handleDownload}>
          <Download className="h-3 w-3" />
          {t("distribution.download_pack", { defaultValue: "Pack .md" })}
        </Button>
      </div>

      {/* Expand variants */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-micro text-primary hover:underline mb-2"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded
          ? t("distribution.hide_variants", { defaultValue: "Ascunde variante" })
          : t("distribution.show_variants", { defaultValue: "Vezi toate variantele" })}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Variant type tabs */}
            <div className="flex gap-1 mb-2 flex-wrap">
              {variantTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setActiveVariantType(type)}
                  className={cn(
                    "text-micro px-2 py-1 rounded-full border transition-colors",
                    activeVariantType === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {type.replace("_", " ")} ({variantsByType[type]?.length || 0})
                </button>
              ))}
            </div>

            {/* Variant cards */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {(variantsByType[activeVariantType] || []).map((variant, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border border-border bg-muted/30 text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-nano font-mono text-muted-foreground">
                      {PLATFORMS[variant.platform]?.icon} {variant.platform}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-micro gap-1 px-1.5"
                      onClick={() => handleCopy(variant.text, variant.platform)}
                    >
                      {copied === variant.platform ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                      {copied === variant.platform ? "✓" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap text-dense leading-relaxed line-clamp-4">
                    {variant.text}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA embed note */}
      <p className="text-nano text-muted-foreground mt-2 flex items-center gap-1">
        <Zap className="h-2.5 w-2.5 text-primary/50" />
        {t("distribution.cta_note", {
          defaultValue: "CTA-ul către AI-IDEI este inclus automat în fiecare variantă",
        })}
      </p>
    </motion.div>
  );
}
