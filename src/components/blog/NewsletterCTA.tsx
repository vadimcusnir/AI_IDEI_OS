import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Check } from "lucide-react";
import { toast } from "sonner";

export function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email, source: "blog" });
    setBusy(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("Could not subscribe. Try again.");
      return;
    }
    setDone(true);
    toast.success("You're in. Watch your inbox.");
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 md:p-8">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-4 h-4 text-primary" />
        <span className="text-[0.6875rem] uppercase tracking-widest font-semibold text-primary">Newsletter</span>
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 tracking-tight">
        Decode AI faster than the rest.
      </h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-md">
        Weekly essays on knowledge extraction, AI strategy, and creator systems. No filler.
      </p>
      {done ? (
        <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Check className="w-4 h-4" /> Subscribed — check your inbox.
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            className="flex-1 h-11"
            required
          />
          <Button type="submit" disabled={busy} className="h-11 px-6">
            {busy ? "..." : "Subscribe"}
          </Button>
        </form>
      )}
    </div>
  );
}
