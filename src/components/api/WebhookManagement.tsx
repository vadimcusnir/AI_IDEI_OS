import { useState } from "react";
import {
  useWebhookEndpoints, useWebhookDeliveries,
  useCreateWebhookEndpoint, useDeleteWebhookEndpoint, useToggleWebhookEndpoint,
} from "@/hooks/useWebhooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Webhook, Plus, Trash2, Copy, ChevronDown, CheckCircle2, XCircle,
  Clock, RotateCcw, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";

const AVAILABLE_EVENTS = [
  { key: "job.completed", label: "Job Completed" },
  { key: "job.failed", label: "Job Failed" },
  { key: "neuron.created", label: "Neuron Created" },
  { key: "artifact.created", label: "Artifact Created" },
  { key: "neuron.updated", label: "Neuron Updated" },
  { key: "credits.low", label: "Credits Low" },
];

function DeliveryLog({ endpointId }: { endpointId: string }) {
  const { data: deliveries, isLoading } = useWebhookDeliveries(endpointId);

  if (isLoading) return <Skeleton className="h-20" />;
  if (!deliveries?.length) return <p className="text-micro text-muted-foreground py-2">No deliveries yet.</p>;

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {deliveries.map((d) => (
        <div key={d.id} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-micro">
          {d.status === "delivered" ? (
            <CheckCircle2 className="h-3 w-3 text-status-validated shrink-0" />
          ) : d.status === "failed" ? (
            <XCircle className="h-3 w-3 text-destructive shrink-0" />
          ) : (
            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          <span className="font-mono">{d.event_type}</span>
          {d.response_status && (
            <Badge variant="outline" className="text-nano px-1 py-0">{d.response_status}</Badge>
          )}
          <span className="flex-1" />
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
          </span>
          {d.attempt > 1 && (
            <Badge variant="outline" className="text-nano px-1 py-0">
              <RotateCcw className="h-2 w-2 mr-0.5" />#{d.attempt}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

export function WebhookManagement() {
  const { t } = useTranslation("common");
  const { data: endpoints, isLoading } = useWebhookEndpoints();
  const createEndpoint = useCreateWebhookEndpoint();
  const deleteEndpoint = useDeleteWebhookEndpoint();
  const toggleEndpoint = useToggleWebhookEndpoint();

  const [showCreate, setShowCreate] = useState(false);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["job.completed"]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!url.trim()) return;
    await createEndpoint.mutateAsync({ url: url.trim(), events: selectedEvents, description: description.trim() });
    setUrl("");
    setDescription("");
    setSelectedEvents(["job.completed"]);
    setShowCreate(false);
  };

  const toggleEvent = (key: string) => {
    setSelectedEvents((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Webhook className="h-4 w-4" /> Webhooks
        </h2>
        <Button size="sm" className="h-7 text-micro" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-3 w-3 mr-1" />Add Endpoint
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-4 space-y-3">
          <Input
            placeholder={t("webhook.url_placeholder")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            placeholder={t("webhook.description_placeholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-8 text-xs"
          />
          <div>
            <p className="text-micro text-muted-foreground mb-1.5">Events to subscribe:</p>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_EVENTS.map((ev) => (
                <button
                  key={ev.key}
                  onClick={() => toggleEvent(ev.key)}
                  className={cn(
                    "px-2 py-1 rounded text-micro font-medium border transition-colors",
                    selectedEvents.includes(ev.key)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {ev.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-micro" onClick={handleCreate} disabled={createEndpoint.isPending || !url.trim()}>
              {createEndpoint.isPending ? "Creating..." : "Create Endpoint"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-micro" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Endpoints list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : endpoints && endpoints.length > 0 ? (
        <div className="space-y-2">
          {endpoints.map((ep) => (
            <Collapsible
              key={ep.id}
              open={expandedId === ep.id}
              onOpenChange={(open) => setExpandedId(open ? ep.id : null)}
            >
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={ep.is_active}
                    onCheckedChange={(checked) => toggleEndpoint.mutate({ id: ep.id, is_active: checked })}
                    className="scale-75"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono truncate">{ep.url}</p>
                    {ep.description && <p className="text-micro text-muted-foreground">{ep.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {ep.failure_count > 0 && (
                      <Badge variant="outline" className="text-nano px-1 py-0 text-destructive border-destructive/30">
                        {ep.failure_count} fails
                      </Badge>
                    )}
                    <div className="flex gap-0.5">
                      {ep.events.map((e) => (
                        <Badge key={e} variant="outline" className="text-nano px-1 py-0">{e}</Badge>
                      ))}
                    </div>
                    <span className="text-nano text-muted-foreground/50 italic">secret hidden</span>
                    <CollapsibleTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </CollapsibleTrigger>
                    <Button
                      size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                      onClick={() => deleteEndpoint.mutate(ep.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CollapsibleContent className="mt-3 pt-3 border-t border-border">
                  <p className="text-micro font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Recent Deliveries</p>
                  <DeliveryLog endpointId={ep.id} />
                  <div className="mt-2 p-2 rounded bg-muted/50">
                    <p className="text-nano text-muted-foreground">
                      Verify signatures with HMAC-SHA256 using your secret. Header: <code className="bg-muted px-1 rounded">X-Webhook-Signature</code>
                    </p>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-6">
          No webhook endpoints configured. Add one to receive real-time event notifications.
        </p>
      )}
    </div>
  );
}
