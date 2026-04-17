import { useState } from "react";
import { Twitter, Linkedin, Link2, Check, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

  const share = (href: string) => window.open(href, "_blank", "noopener,noreferrer,width=600,height=500");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const Btn = ({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) => (
    <Button variant="outline" size="icon" onClick={onClick} aria-label={label} className="h-9 w-9 rounded-full">
      {children}
    </Button>
  );

  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.6875rem] uppercase tracking-widest font-semibold text-muted-foreground mr-1">Share</span>
      <Btn onClick={() => share(`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`)} label="Share on X">
        <Twitter className="w-4 h-4" />
      </Btn>
      <Btn onClick={() => share(`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`)} label="Share on LinkedIn">
        <Linkedin className="w-4 h-4" />
      </Btn>
      <Btn onClick={() => share(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`)} label="Share on Facebook">
        <Facebook className="w-4 h-4" />
      </Btn>
      <Btn onClick={copy} label="Copy link">
        {copied ? <Check className="w-4 h-4 text-primary" /> : <Link2 className="w-4 h-4" />}
      </Btn>
    </div>
  );
}
