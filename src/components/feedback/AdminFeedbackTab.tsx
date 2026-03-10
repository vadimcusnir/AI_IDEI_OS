import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageCircle, Star, ThumbsUp, AlertTriangle, Lightbulb, Quote,
  Loader2, Send, CheckCircle2, Eye, Filter, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";

interface FeedbackRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  rating: number | null;
  status: string;
  admin_response: string | null;
  is_public: boolean;
  context_page: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  feedback: ThumbsUp, testimonial: Quote, review: Star,
  proposal: Lightbulb, complaint: AlertTriangle,
};

const TYPE_COLORS: Record<string, string> = {
  feedback: "text-primary", testimonial: "text-emerald-500", review: "text-amber-500",
  proposal: "text-amber-500", complaint: "text-destructive",
};

const STATUS_OPTIONS = [
  { key: "pending", label: "Pending" },
  { key: "reviewed", label: "Revizuit" },
  { key: "resolved", label: "Rezolvat" },
  { key: "published", label: "Publicat" },
];

export function AdminFeedbackTab() {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);

  const loadFeedback = useCallback(async () => {
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setItems((data as unknown as FeedbackRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadFeedback(); }, [loadFeedback]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("feedback")
      .update({ status } as any)
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status actualizat: ${status}`);
    loadFeedback();
  };

  const togglePublic = async (id: string, current: boolean) => {
    const updatePayload: any = { is_public: !current };
    if (!current) updatePayload.status = "published";
    const { error } = await supabase
      .from("feedback")
      .update(updatePayload)
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(!current ? "Publicat" : "Ascuns de pe pagina publică");
    loadFeedback();
  };

  const sendResponse = async (id: string) => {
    if (!responseText.trim()) return;
    setSendingResponse(true);
    const { error } = await supabase
      .from("feedback")
      .update({
        admin_response: responseText.trim(),
        admin_responded_at: new Date().toISOString(),
        status: "reviewed",
      } as any)
      .eq("id", id);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Răspuns trimis");
      setRespondingId(null);
      setResponseText("");
      loadFeedback();
    }
    setSendingResponse(false);
  };

  const filtered = items.filter((i) => {
    if (filter === "all") return true;
    if (filter === "pending") return i.status === "pending";
    return i.type === filter;
  });

  const stats = {
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    complaints: items.filter((i) => i.type === "complaint").length,
    avgRating: (() => {
      const rated = items.filter((i) => i.rating);
      return rated.length > 0 ? (rated.reduce((s, i) => s + (i.rating || 0), 0) / rated.length).toFixed(1) : "N/A";
    })(),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-lg font-bold font-mono">{stats.total}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Total</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-lg font-bold font-mono text-amber-500">{stats.pending}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Pending</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-lg font-bold font-mono text-destructive">{stats.complaints}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Plângeri</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-lg font-bold font-mono text-primary">{stats.avgRating}</p>
          <p className="text-[9px] text-muted-foreground uppercase">Rating mediu</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {[
          { key: "all", label: "Toate" },
          { key: "pending", label: `Pending (${stats.pending})` },
          { key: "complaint", label: "Plângeri" },
          { key: "proposal", label: "Propuneri" },
          { key: "testimonial", label: "Testimoniale" },
          { key: "review", label: "Recenzii" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors whitespace-nowrap",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-center py-8 text-sm text-muted-foreground">Niciun feedback.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const Icon = TYPE_ICONS[item.type] || MessageCircle;
            const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ro });

            return (
              <div key={item.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", TYPE_COLORS[item.type] || "text-muted-foreground")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium">{item.title}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                        {item.type}
                      </span>
                      <span className={cn(
                        "text-[8px] px-1.5 py-0.5 rounded uppercase",
                        item.status === "pending" ? "bg-amber-500/10 text-amber-600" :
                        item.status === "resolved" ? "bg-emerald-500/10 text-emerald-600" :
                        "bg-primary/10 text-primary"
                      )}>
                        {item.status}
                      </span>
                      {item.is_public && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                          PUBLIC
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-2">{item.message}</p>

                    {item.rating && (
                      <div className="flex items-center gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn("h-3 w-3", s <= item.rating! ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20")}
                          />
                        ))}
                      </div>
                    )}

                    {item.admin_response && (
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-2 mb-2">
                        <p className="text-[10px] font-semibold text-primary mb-0.5 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Răspuns
                        </p>
                        <p className="text-[11px] text-muted-foreground">{item.admin_response}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                      <span>{timeAgo}</span>
                      {item.context_page && <span>• {item.context_page}</span>}
                      <span>• {item.user_id.substring(0, 8)}…</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {STATUS_OPTIONS.filter((s) => s.key !== item.status).map((s) => (
                        <button
                          key={s.key}
                          onClick={() => updateStatus(item.id, s.key)}
                          className="text-[9px] px-2 py-0.5 rounded border border-border hover:bg-muted transition-colors"
                        >
                          {s.label}
                        </button>
                      ))}
                      <button
                        onClick={() => togglePublic(item.id, item.is_public)}
                        className="text-[9px] px-2 py-0.5 rounded border border-border hover:bg-muted transition-colors flex items-center gap-1"
                      >
                        <Eye className="h-2.5 w-2.5" />
                        {item.is_public ? "Ascunde" : "Publică"}
                      </button>
                      <button
                        onClick={() => { setRespondingId(item.id); setResponseText(item.admin_response || ""); }}
                        className="text-[9px] px-2 py-0.5 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
                      >
                        <Send className="h-2.5 w-2.5" /> Răspunde
                      </button>
                    </div>

                    {/* Response input */}
                    {respondingId === item.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Scrie răspunsul..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={3}
                          className="text-xs resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => sendResponse(item.id)} disabled={sendingResponse} className="text-xs gap-1">
                            {sendingResponse ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            Trimite
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRespondingId(null)} className="text-xs">
                            Anulează
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
