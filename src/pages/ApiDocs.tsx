import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Key, Copy, Trash2, Plus, Loader2, Eye, EyeOff,
  Code2, Shield, Zap, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WebhookManagement } from "@/components/api/WebhookManagement";
import { useTranslation } from "react-i18next";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  requests_today: number;
  daily_limit: number;
  created_at: string;
  expires_at: string | null;
}

const ENDPOINTS = [
  { method: "GET", path: "/neurons", desc: "List neurons (paginated)", scope: "read", params: "page, per_page, status, sort, order" },
  { method: "GET", path: "/neurons/:id", desc: "Get neuron by number", scope: "read", params: "include=blocks,links" },
  { method: "POST", path: "/neurons", desc: "Create neuron", scope: "write", params: "title" },
  { method: "PATCH", path: "/neurons/:id", desc: "Update neuron", scope: "write", params: "title, status, visibility" },
  { method: "DELETE", path: "/neurons/:id", desc: "Delete neuron", scope: "write", params: "" },
  { method: "GET", path: "/neurons/:id/blocks", desc: "List blocks", scope: "read", params: "" },
  { method: "POST", path: "/neurons/:id/blocks", desc: "Add block", scope: "write", params: "type, content, position" },
  { method: "POST", path: "/neurons/:id/clone", desc: "Clone neuron", scope: "write", params: "" },
  { method: "POST", path: "/neurons/:id/fork", desc: "Fork neuron", scope: "write", params: "" },
  { method: "GET", path: "/neurons/:id/versions", desc: "List versions", scope: "read", params: "" },
  { method: "GET", path: "/entities", desc: "List entities (paginated)", scope: "read", params: "page, per_page, type, sort, order" },
  { method: "GET", path: "/entities/:slug", desc: "Get entity with relations", scope: "read", params: "" },
  { method: "GET", path: "/idearank", desc: "Top entities by IdeaRank", scope: "read", params: "limit" },
  { method: "GET", path: "/jobs", desc: "List your jobs", scope: "read", params: "page, per_page, status" },
  { method: "GET", path: "/jobs/:id", desc: "Get job detail", scope: "read", params: "" },
  { method: "GET", path: "/search", desc: "Search neurons", scope: "read", params: "q" },
  { method: "GET", path: "/templates", desc: "List templates", scope: "read", params: "" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-status-validated/15 text-status-validated",
  POST: "bg-primary/15 text-primary",
  PATCH: "bg-ai-accent/15 text-ai-accent",
  DELETE: "bg-destructive/15 text-destructive",
};

export default function ApiDocs() {
  const { user } = useAuth();
  const { t } = useTranslation("pages");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["read"]);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadKeys();
  }, [user]);

  const loadKeys = async () => {
    const { data } = await supabase
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false });
    setKeys((data as ApiKey[]) || []);
    setLoading(false);
  };

  const generateKey = async () => {
    if (!user || !newKeyName.trim()) return;
    setCreating(true);

    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const rawKey = "aiidei_" + Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
    const prefix = rawKey.slice(0, 14) + "...";

    const encoder = new TextEncoder();
    const data = encoder.encode(rawKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    const { error } = await supabase.from("api_keys").insert({
      user_id: user.id,
      key_hash: keyHash,
      key_prefix: prefix,
      name: newKeyName.trim(),
      scopes: newKeyScopes,
    });

    if (error) {
      toast.error(t("api_docs.create_error"));
    } else {
      setRevealedKey(rawKey);
      toast.success(t("api_docs.create_success"));
      setNewKeyName("");
      loadKeys();
    }
    setCreating(false);
  };

  const deleteKey = async (id: string) => {
    await supabase.from("api_keys").delete().eq("id", id);
    toast.success(t("api_docs.delete_success"));
    loadKeys();
  };

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neuron-api`;

  return (
    <div className="flex-1 overflow-auto">
      <SEOHead title={`${t("api_docs.title")} — AI-IDEI`} description={t("api_docs.subtitle")} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-1">{t("api_docs.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("api_docs.subtitle")}</p>
        </div>

        {/* Quick start */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-xl border border-border bg-card">
            <Shield className="h-5 w-5 text-primary mb-2" />
            <p className="text-xs font-semibold mb-1">{t("api_docs.auth_title")}</p>
            <p className="text-micro text-muted-foreground">Header: <code className="bg-muted px-1 rounded">X-API-Key: aiidei_xxx</code></p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <Zap className="h-5 w-5 text-ai-accent mb-2" />
            <p className="text-xs font-semibold mb-1">{t("api_docs.rate_limit_title")}</p>
            <p className="text-micro text-muted-foreground">{t("api_docs.rate_limit_desc")}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <Globe className="h-5 w-5 text-status-validated mb-2" />
            <p className="text-xs font-semibold mb-1">{t("api_docs.base_url_title")}</p>
            <p className="text-micro text-muted-foreground font-mono break-all">/functions/v1/neuron-api</p>
          </div>
        </div>

        {/* API Keys Management */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Key className="h-4 w-4" /> {t("api_docs.api_keys")}
          </h2>

          {revealedKey && (
            <div className="mb-4 p-4 rounded-xl border-2 border-primary/30 bg-primary/5">
              <p className="text-xs font-semibold text-primary mb-2">🔑 {t("api_docs.new_key_banner")}</p>
              <div className="flex items-center gap-2">
                <code className="text-micro bg-muted px-2 py-1 rounded font-mono flex-1 break-all">{revealedKey}</code>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => { navigator.clipboard.writeText(revealedKey); toast.success(t("api_docs.copied")); }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <Button size="sm" variant="outline" className="mt-2 text-micro" onClick={() => setRevealedKey(null)}>
                {t("api_docs.copied_hide")}
              </Button>
            </div>
          )}

          <div className="flex items-end gap-2 mb-4">
            <div className="flex-1">
              <label className="text-micro text-muted-foreground mb-1 block">{t("api_docs.key_name_label")}</label>
              <Input
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder={t("api_docs.key_name_placeholder")}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex gap-1">
              {["read", "write"].map(scope => (
                <button
                  key={scope}
                  onClick={() => setNewKeyScopes(prev =>
                    prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
                  )}
                  className={cn(
                    "px-2 py-1.5 rounded text-micro font-medium border transition-colors",
                    newKeyScopes.includes(scope) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  {scope}
                </button>
              ))}
            </div>
            <Button size="sm" className="h-8 gap-1" onClick={generateKey} disabled={creating || !newKeyName.trim()}>
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              {t("api_docs.generate")}
            </Button>
          </div>

          <div className="space-y-1.5">
            {keys.map(key => (
              <div key={key.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium">{key.name}</span>
                  <span className="text-micro text-muted-foreground ml-2 font-mono">{key.key_prefix}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-nano text-muted-foreground">{key.requests_today}/{key.daily_limit} {t("api_docs.today")}</span>
                  {key.scopes.map(s => (
                    <span key={s} className="text-nano px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">{s}</span>
                  ))}
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteKey(key.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {keys.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground text-center py-4">{t("api_docs.no_keys")}</p>
            )}
          </div>
        </div>

        {/* Example */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Code2 className="h-4 w-4" /> {t("api_docs.curl_example")}
          </h2>
          <pre className="bg-muted rounded-xl p-4 text-micro font-mono overflow-x-auto whitespace-pre-wrap text-muted-foreground">
{`curl -H "X-API-Key: aiidei_your_key_here" \\
  "${baseUrl}/neurons?page=1&per_page=10"

# Create neuron
curl -X POST \\
  -H "X-API-Key: aiidei_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "My Neuron"}' \\
  "${baseUrl}/neurons"

# Get IdeaRank leaderboard
curl -H "X-API-Key: aiidei_your_key_here" \\
  "${baseUrl}/idearank?limit=20"`}
          </pre>
        </div>

        {/* Endpoints */}
        <div>
          <h2 className="text-sm font-semibold mb-3">{t("api_docs.endpoints")}</h2>
          <div className="space-y-1">
            {ENDPOINTS.map((ep, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors">
                <span className={cn("text-nano font-bold uppercase px-1.5 py-0.5 rounded", METHOD_COLORS[ep.method])}>
                  {ep.method}
                </span>
                <code className="text-micro font-mono text-foreground">{ep.path}</code>
                <span className="text-micro text-muted-foreground flex-1">{ep.desc}</span>
                <span className="text-nano px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">{ep.scope}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Webhooks */}
        <div className="mb-8">
          <WebhookManagement />
        </div>

        {/* Response format */}
        <div className="mt-8 p-4 rounded-xl border border-border bg-card">
          <h3 className="text-xs font-semibold mb-2">{t("api_docs.response_format")}</h3>
          <pre className="text-micro font-mono text-muted-foreground">
{`// ${t("api_docs.paginated_lists")}
{
  "data": [...],
  "total": 42,
  "page": 1,
  "per_page": 20
}

// ${t("api_docs.errors")}
{
  "error": "Error description"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
