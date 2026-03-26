/**
 * ShareResultCard — Shareable card overlay after job completion.
 * Generates social share links with UTM tracking for viral loops.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Twitter, Linkedin, Send, CheckCircle2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getReferralLink } from "@/hooks/useReferralTracking";

interface ShareResultCardProps {
  open: boolean;
  onClose: () => void;
  title: string;
  summary?: string;
  publicUrl?: string;
  jobType?: string;
}

const CHANNELS = [
  { key: "twitter", label: "Twitter / X", icon: Twitter },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "telegram", label: "Telegram", icon: Send },
] as const;

function buildShareUrl(channel: string, url: string, text: string): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  switch (channel) {
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    default:
      return url;
  }
}

export function ShareResultCard({ open, onClose, title, summary, publicUrl, jobType }: ShareResultCardProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const shareUrl = publicUrl
    ? `${publicUrl}${user ? `?ref=${user.id}` : ""}`
    : user ? getReferralLink(user.id) : "https://ai-idei.com";

  const shareText = summary
    ? `${title} — ${summary.slice(0, 100)}...\n\nGenerat cu AI-IDEI`
    : `${title}\n\nGenerat cu AI-IDEI`;

  const trackShare = (channel: string) => {
    supabase.from("analytics_events").insert({
      event_name: "share_click",
      user_id: user?.id ?? null,
      event_params: { channel, job_type: jobType, title },
      session_id: sessionStorage.getItem("session_id") ?? crypto.randomUUID(),
    }).then(() => {});
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copiat!");
    trackShare("clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[hsl(var(--gold-oxide))]" />
            Rezultat generat!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
            <p className="text-sm font-medium truncate">{title}</p>
            {summary && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{summary}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Distribuie rezultatul și câștigă vizibilitate:
          </p>

          <div className="flex gap-2">
            {CHANNELS.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => {
                  trackShare(key);
                  window.open(buildShareUrl(key, shareUrl, shareText), "_blank", "noopener");
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label.split(" ")[0]}
              </Button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={handleCopy}
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiat!" : "Copiază link-ul"}
          </Button>

          {publicUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2 text-xs text-muted-foreground"
              onClick={() => window.open(publicUrl, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Deschide pagina publică
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
