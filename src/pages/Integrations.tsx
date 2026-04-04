import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plug, RefreshCw, Copy, Check, Loader2, ExternalLink, Trash2,
  Video, FileText, Zap, Webhook, Rss, Upload, Plus, Clock,
  AlertCircle, CheckCircle2, XCircle, BarChart3,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  video: Video, "file-text": FileText, zap: Zap, webhook: Webhook,
  rss: Rss, upload: Upload, plug: Plug,
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  connected: { icon: CheckCircle2, color: "text-success", label: "Connected" },
  syncing: { icon: RefreshCw, color: "text-semantic-blue animate-spin", label: "Syncing" },
  error: { icon: AlertCircle, color: "text-destructive", label: "Error" },
  disconnected: { icon: XCircle, color: "text-muted-foreground", label: "Disconnected" },
};

export default function Integrations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState("");

  // Fetch connectors
  const { data: connectors = [] } = useQuery({
    queryKey: ["integration-connectors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("integration_connectors")
        .select("*")
        .eq("is_active", true)
        .order("display_name");
      return data || [];
    },
  });

  // Fetch user integrations
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["user-integrations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_integrations")
        .select("*, integration_connectors(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch incoming webhooks
  const { data: webhooks = [] } = useQuery({
    queryKey: ["incoming-webhooks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("incoming_webhooks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch source documents stats
  const { data: docStats } = useQuery({
    queryKey: ["source-doc-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("source_documents")
        .select("status")
        .eq("user_id", user.id);
      const stats = { total: 0, pending: 0, completed: 0, failed: 0, duplicate: 0 };
      (data || []).forEach((d: any) => {
        stats.total++;
        if (d.status in stats) (stats as any)[d.status]++;
      });
      return stats;
    },
    enabled: !!user,
  });

  // Fetch sync history
  const { data: syncHistory = [] } = useQuery({
    queryKey: ["sync-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("sync_history")
        .select("*, user_integrations(integration_connectors(display_name, icon))")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  // Connect integration
  const connectMutation = useMutation({
    mutationFn: async (connectorId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("user_integrations").insert({
        user_id: user.id,
        connector_id: connectorId,
        status: "connected",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-integrations"] });
      toast.success(t("toast_connected"));
    },
    onError: (err: any) => {
      if (err.message?.includes("duplicate")) {
        toast.error(t("toast_already_connected"));
      } else {
        toast.error(err.message);
      }
    },
  });

  // Disconnect integration
  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from("user_integrations")
        .update({ status: "disconnected" })
        .eq("id", integrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-integrations"] });
      toast.success(t("toast_disconnected"));
    },
  });

  // Trigger sync
  const syncMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase.functions.invoke("integration-sync", {
        body: { integration_id: integrationId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-integrations"] });
      queryClient.invalidateQueries({ queryKey: ["sync-history"] });
      toast.success(t("toast_sync_triggered"));
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Create incoming webhook
  const createWebhookMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("incoming_webhooks").insert({
        user_id: user.id,
        name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incoming-webhooks"] });
      setShowNewWebhook(false);
      setNewWebhookName("");
      toast.success(t("toast_webhook_created"));
    },
  });

  // Delete webhook
  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("incoming_webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incoming-webhooks"] });
      toast.success(t("toast_webhook_deleted"));
    },
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const connectedIds = new Set(
    integrations
      .filter((i: any) => i.status !== "disconnected")
      .map((i: any) => i.connector_id)
  );

  const webhookBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-ingest`;

  return (
    <PageTransition>
      <SEOHead title="Integrations | AI-IDEI" description="Connect external sources and automate knowledge ingestion" />

      <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Connect sources, automate ingestion, build your knowledge hub
            </p>
          </div>
          {docStats && (
            <div className="flex gap-3 text-sm">
              <Badge variant="outline">{docStats.total} documents</Badge>
              <Badge variant="secondary">{docStats.completed} processed</Badge>
              {docStats.duplicate > 0 && (
                <Badge variant="destructive">{docStats.duplicate} duplicates</Badge>
              )}
            </div>
          )}
        </div>

        <Tabs defaultValue="connectors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="connectors">Connectors</TabsTrigger>
            <TabsTrigger value="webhooks">Incoming Webhooks</TabsTrigger>
            <TabsTrigger value="history">Sync History</TabsTrigger>
          </TabsList>

          {/* ── Connectors Tab ── */}
          <TabsContent value="connectors" className="space-y-4">
            {/* Connected integrations */}
            {integrations.filter((i: any) => i.status !== "disconnected").length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Active Connections</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {integrations
                    .filter((i: any) => i.status !== "disconnected")
                    .map((integration: any) => {
                      const connector = integration.integration_connectors;
                      const IconComp = ICON_MAP[connector?.icon] || Plug;
                      const statusConf = STATUS_CONFIG[integration.status] || STATUS_CONFIG.disconnected;
                      const StatusIcon = statusConf.icon;

                      return (
                        <Card key={integration.id} className="border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <IconComp className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">{connector?.display_name}</div>
                                  <div className="flex items-center gap-1.5 text-xs mt-0.5">
                                    <StatusIcon className={cn("h-3 w-3", statusConf.color)} />
                                    <span className="text-muted-foreground">{statusConf.label}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {connector?.sync_mode === "scheduled" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => syncMutation.mutate(integration.id)}
                                    disabled={syncMutation.isPending}
                                  >
                                    <RefreshCw className={cn("h-4 w-4", syncMutation.isPending && "animate-spin")} />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => disconnectMutation.mutate(integration.id)}
                                >
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                              <div>
                                <span className="font-medium text-foreground">{integration.documents_imported}</span> docs
                              </div>
                              <div>
                                <span className="font-medium text-foreground">{integration.neurons_generated}</span> neurons
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {integration.last_sync_at
                                  ? new Date(integration.last_sync_at).toLocaleDateString()
                                  : "Never"}
                              </div>
                            </div>
                            {integration.error_message && (
                              <p className="mt-2 text-xs text-destructive">{integration.error_message}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Available connectors */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Available Connectors</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {connectors.map((c: any) => {
                  const IconComp = ICON_MAP[c.icon] || Plug;
                  const isConnected = connectedIds.has(c.id);

                  return (
                    <Card key={c.id} className={cn("border-border/50 transition-colors", isConnected && "opacity-60")}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <IconComp className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{c.display_name}</div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex gap-1.5">
                            <Badge variant="outline" className="text-micro">{c.auth_type}</Badge>
                            <Badge variant="outline" className="text-micro">{c.sync_mode}</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant={isConnected ? "outline" : "default"}
                            disabled={isConnected || connectMutation.isPending}
                            onClick={() => connectMutation.mutate(c.id)}
                          >
                            {isConnected ? "Connected" : "Connect"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ── Webhooks Tab ── */}
          <TabsContent value="webhooks" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Incoming Webhooks</h2>
              <Dialog open={showNewWebhook} onOpenChange={setShowNewWebhook}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Webhook</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Incoming Webhook</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={newWebhookName}
                        onChange={(e) => setNewWebhookName(e.target.value)}
                        placeholder="e.g. Zapier Ingest"
                      />
                    </div>
                    <Button
                      onClick={() => createWebhookMutation.mutate(newWebhookName || "My Webhook")}
                      disabled={createWebhookMutation.isPending}
                      className="w-full"
                    >
                      Create
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>
                  Send <code className="bg-muted px-1 rounded text-xs">POST</code> requests to ingest content automatically.
                  Include <code className="bg-muted px-1 rounded text-xs">?key=YOUR_KEY</code> in the URL.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {webhooks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No webhooks created yet</p>
                ) : (
                  webhooks.map((wh: any) => {
                    const fullUrl = `${webhookBaseUrl}?key=${wh.webhook_key}`;
                    return (
                      <div key={wh.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Webhook className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{wh.name}</span>
                            <Badge variant={wh.is_active ? "default" : "secondary"} className="text-micro">
                              {wh.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{wh.calls_count} calls</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <code className="text-micro text-muted-foreground truncate max-w-[400px]">{fullUrl}</code>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(fullUrl, wh.id)}
                            >
                              {copiedKey === wh.id ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteWebhookMutation.mutate(wh.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Payload docs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Payload Format</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`POST ${webhookBaseUrl}?key=YOUR_KEY
Content-Type: application/json

{
  "title": "My Document",
  "content": "Full text content here...",
  "content_type": "text",  // text | url | html
  "url": "https://...",    // optional external URL
  "metadata": {}           // optional custom metadata
}`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Sync History Tab ── */}
          <TabsContent value="history" className="space-y-4">
            <h2 className="text-lg font-semibold">Sync History</h2>
            {syncHistory.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No sync runs yet. Connect an integration and trigger a sync.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {syncHistory.map((sync: any) => {
                  const connector = sync.user_integrations?.integration_connectors;
                  const IconComp = ICON_MAP[connector?.icon] || Plug;
                  const isOk = sync.status === "completed";

                  return (
                    <Card key={sync.id} className="border-border/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <IconComp className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {connector?.display_name || "Unknown"}
                            </span>
                            <Badge variant={isOk ? "default" : "destructive"} className="text-micro">
                              {sync.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {sync.documents_new} new · {sync.documents_skipped} skipped · {sync.neurons_generated} neurons
                            {sync.duration_ms && ` · ${(sync.duration_ms / 1000).toFixed(1)}s`}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(sync.started_at).toLocaleString()}
                        </span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
