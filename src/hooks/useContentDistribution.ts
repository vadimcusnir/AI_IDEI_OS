/**
 * Content Distribution Hook
 * Classifies content, generates platform-specific variants, tracks shares.
 */
import { useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";

// ─── Content Categories ───
export type ContentCategory = "viral_short" | "authority_long" | "educational" | "controversial" | "utility_tool";

// ─── Platform Channels ───
export type DistributionChannel = "twitter" | "linkedin" | "telegram" | "tiktok" | "instagram" | "youtube" | "blog" | "newsletter" | "reddit";

export interface ContentVariant {
  type: "hook" | "short" | "long_form" | "carousel_slide" | "quote_card";
  platform: DistributionChannel;
  text: string;
  cta: string;
}

export interface DistributionPlan {
  category: ContentCategory;
  channels: DistributionChannel[];
  variants: ContentVariant[];
  ctaText: string;
}

// ─── Classification Logic ───
function classifyContent(text: string, serviceKey: string): ContentCategory {
  const wordCount = text.split(/\s+/).length;
  const hasData = /\d+%|\$\d+|ROI|KPI|metric/i.test(text);
  const isControversial = /myth|wrong|lie|truth|actually|contrary/i.test(text);

  if (isControversial && wordCount < 300) return "controversial";
  if (wordCount < 150) return "viral_short";
  if (hasData || serviceKey.includes("analysis") || serviceKey.includes("audit") || serviceKey.includes("research")) return "authority_long";
  if (serviceKey.includes("course") || serviceKey.includes("guide") || serviceKey.includes("webinar")) return "educational";
  return "utility_tool";
}

// ─── Platform Mapping ───
const CHANNEL_MAP: Record<ContentCategory, DistributionChannel[]> = {
  viral_short: ["twitter", "telegram", "linkedin"],
  authority_long: ["linkedin", "blog", "newsletter"],
  educational: ["linkedin", "twitter", "telegram"],
  controversial: ["twitter", "reddit", "telegram"],
  utility_tool: ["linkedin", "twitter", "telegram"],
};

// ─── CTA Templates ───
const CTA_BY_PLATFORM: Record<DistributionChannel, string> = {
  twitter: "🧠 Generat cu AI-IDEI → ai-idei-os.lovable.app",
  linkedin: "Generat automat cu AI-IDEI — platforma de capitalizare a cunoștințelor → ai-idei-os.lovable.app",
  telegram: "⚡ Generează și tu → ai-idei-os.lovable.app",
  tiktok: "Link în bio → AI-IDEI",
  instagram: "Link în bio → AI-IDEI",
  youtube: "Testează gratuit → ai-idei-os.lovable.app",
  blog: "Acest conținut a fost generat cu AI-IDEI. Încearcă gratuit: ai-idei-os.lovable.app",
  newsletter: "Generat cu AI-IDEI — începe gratuit: ai-idei-os.lovable.app",
  reddit: "Made with AI-IDEI → ai-idei-os.lovable.app",
};

// ─── Variant Generators ───
function generateHookVariants(text: string, cta: string): ContentVariant[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const hooks = sentences.slice(0, 3);

  return hooks.map((hook, i) => ({
    type: "hook" as const,
    platform: "twitter" as DistributionChannel,
    text: `${hook.trim()}.${i === 0 ? "\n\n🧵 Thread:" : ""}\n\n${cta}`,
    cta,
  }));
}

function generateShortVersion(text: string, cta: string): ContentVariant {
  const words = text.split(/\s+/);
  const shortText = words.slice(0, 80).join(" ") + (words.length > 80 ? "..." : "");
  return {
    type: "short",
    platform: "telegram",
    text: `${shortText}\n\n${cta}`,
    cta,
  };
}

function generateQuoteCards(text: string, cta: string): ContentVariant[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30 && s.trim().length < 200);
  return sentences.slice(0, 3).map(quote => ({
    type: "quote_card" as const,
    platform: "linkedin" as DistributionChannel,
    text: `"${quote.trim()}."\n\n${cta}`,
    cta,
  }));
}

function generateCarouselSlides(text: string, cta: string): ContentVariant[] {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);
  return paragraphs.slice(0, 7).map((p, i) => ({
    type: "carousel_slide" as const,
    platform: "linkedin" as DistributionChannel,
    text: i === paragraphs.length - 1 ? `${p.trim()}\n\n${cta}` : p.trim(),
    cta,
  }));
}

export function useContentDistribution(content: string, serviceKey: string) {
  const { user } = useAuth();

  const plan = useMemo<DistributionPlan>(() => {
    const category = classifyContent(content, serviceKey);
    const channels = CHANNEL_MAP[category];
    const mainCta = CTA_BY_PLATFORM[channels[0]] || CTA_BY_PLATFORM.twitter;

    const variants: ContentVariant[] = [
      ...generateHookVariants(content, CTA_BY_PLATFORM.twitter),
      generateShortVersion(content, CTA_BY_PLATFORM.telegram),
      ...generateQuoteCards(content, CTA_BY_PLATFORM.linkedin),
      ...generateCarouselSlides(content, mainCta),
    ];

    return { category, channels, variants, ctaText: mainCta };
  }, [content, serviceKey]);

  const trackShare = useCallback(async (platform: DistributionChannel, preview?: string) => {
    if (!user) return;

    await (supabase.from("share_events" as any).insert({
      user_id: user.id,
      content_type: "service_output",
      content_category: plan.category,
      service_key: serviceKey,
      platform,
      share_text_preview: preview?.slice(0, 200),
      has_cta: true,
    } as any) as any);

    trackInternalEvent({
      event: AnalyticsEvents.SHARE_TRIGGERED,
      params: { platform, category: plan.category, service_key: serviceKey },
    });
  }, [user, plan.category, serviceKey]);

  return { plan, trackShare };
}
