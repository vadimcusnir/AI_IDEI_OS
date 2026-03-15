import { useState } from "react";
import { useCreateContribution, useMyContributions } from "@/hooks/useContributions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  PenTool, Clock, CheckCircle2, XCircle, Coins, FileText, Tag,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-warning", label: "In Review" },
  approved: { icon: CheckCircle2, color: "text-status-validated", label: "Approved" },
  rejected: { icon: XCircle, color: "text-destructive", label: "Rejected" },
};

const TYPES = [
  { value: "text", label: "Text / Article" },
  { value: "framework", label: "Framework" },
  { value: "checklist", label: "Checklist" },
  { value: "case_study", label: "Case Study" },
  { value: "template", label: "Template" },
];

export function ContributeDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("text");
  const [tagsInput, setTagsInput] = useState("");
  const createContribution = useCreateContribution();

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const estimatedBonus = Math.max(5, 5 + Math.floor(Math.min(wordCount / 100 * 10, 30) / 10));

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    await createContribution.mutateAsync({ title: title.trim(), content: content.trim(), tags, contribution_type: type });
    setTitle("");
    setContent("");
    setTagsInput("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <PenTool className="h-3.5 w-3.5" />
          Contribute
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-4 w-4 text-primary" />
            Submit Contribution
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 h-8 text-xs"
            />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="Write your contribution... Detailed content earns higher quality scores and more NEURONS."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="text-xs"
          />

          <Input
            placeholder="Tags (comma separated): marketing, framework, ai"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="h-8 text-xs"
          />

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />{wordCount} words
              </span>
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />{tagsInput.split(",").filter((t) => t.trim()).length} tags
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-primary">
              <Coins className="h-3.5 w-3.5" />
              ~{estimatedBonus} NEURONS reward
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Contributions are reviewed before approval. Quality score is calculated automatically based on length,
            detail, and tags. Higher scores = more NEURONS. Minimum 50 words required.
          </p>

          <Button
            onClick={handleSubmit}
            disabled={createContribution.isPending || !title.trim() || wordCount < 50}
            className="w-full"
          >
            {createContribution.isPending ? "Submitting..." : "Submit for Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ContributionsList() {
  const { data: contributions, isLoading } = useMyContributions();

  if (isLoading || !contributions?.length) return null;

  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Contributions</h3>
      <div className="space-y-1.5">
        {contributions.slice(0, 5).map((c) => {
          const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
          const StatusIcon = statusCfg.icon;
          return (
            <div key={c.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card">
              <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${statusCfg.color}`} />
              <span className="text-xs font-medium flex-1 truncate">{c.title}</span>
              <Badge variant="outline" className={`text-[8px] px-1 py-0 ${statusCfg.color}`}>
                {statusCfg.label}
              </Badge>
              {c.neurons_awarded > 0 && (
                <Badge className="text-[8px] px-1 py-0 bg-primary/10 text-primary border-primary/20">
                  +{c.neurons_awarded} NEURONS
                </Badge>
              )}
              <span className="text-[9px] text-muted-foreground">Q:{c.quality_score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
