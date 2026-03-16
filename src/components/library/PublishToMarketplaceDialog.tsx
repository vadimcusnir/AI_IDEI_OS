import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Store, DollarSign, Coins, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PublishToMarketplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifact: {
    id: string;
    title: string;
    content: string;
    artifact_type: string;
    tags: string[];
  };
}

function isRoot2(n: number): boolean {
  if (n <= 0) return false;
  let sum = n;
  while (sum >= 10) {
    sum = String(sum).split("").reduce((a, d) => a + Number(d), 0);
  }
  return sum === 2;
}

function nearestRoot2(n: number): number {
  if (n <= 2) return 2;
  let above = n;
  let below = n;
  while (!isRoot2(above)) above++;
  while (below > 0 && !isRoot2(below)) below--;
  return (n - below <= above - n) ? below : above;
}

const ASSET_TYPES = [
  { value: "template", label: "Template" },
  { value: "framework", label: "Framework" },
  { value: "course", label: "Course" },
  { value: "bundle", label: "Bundle" },
  { value: "report", label: "Report" },
];

export function PublishToMarketplaceDialog({ open, onOpenChange, artifact }: PublishToMarketplaceDialogProps) {
  const { user } = useAuth();
  const { t } = useTranslation(["common", "errors"]);
  const [title, setTitle] = useState(artifact.title);
  const [description, setDescription] = useState("");
  const [assetType, setAssetType] = useState("template");
  const [priceUsd, setPriceUsd] = useState("11");
  const [priceNeurons, setPriceNeurons] = useState("1100");
  const [previewContent, setPreviewContent] = useState(artifact.content.slice(0, 300));
  const [tags, setTags] = useState(artifact.tags.join(", "));
  const [publishing, setPublishing] = useState(false);

  const usdNum = Number(priceUsd) || 0;
  const neuronsNum = Number(priceNeurons) || 0;
  const usdValid = isRoot2(usdNum);
  const neuronsValid = isRoot2(neuronsNum);

  const creatorRevenue = (usdNum * 0.7).toFixed(2);
  const platformFee = (usdNum * 0.3).toFixed(2);

  const handlePublish = async () => {
    if (!user) return;
    if (!usdValid) {
      toast.error(t("errors:price_not_root2_usd", { suggestion: nearestRoot2(usdNum) }));
      return;
    }
    if (!neuronsValid) {
      toast.error(t("errors:price_not_root2_neurons", { suggestion: nearestRoot2(neuronsNum) }));
      return;
    }
    setPublishing(true);
    const { error } = await supabase.from("knowledge_assets").insert({
      author_id: user.id,
      title,
      description,
      asset_type: assetType,
      price_usd: usdNum,
      price_neurons: neuronsNum,
      preview_content: previewContent,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      artifact_ids: [artifact.id],
      is_published: true,
    });
    setPublishing(false);
    if (error) {
      toast.error(t("errors:publish_error", { message: error.message }));
    } else {
      toast.success(t("common:asset_published"));
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Store className="h-4 w-4 text-primary" /> {t("common:publish_marketplace")}
          </DialogTitle>
          <DialogDescription>
            {t("common:asset_desc_hint")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">{t("common:title")}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="h-8 text-sm" />
          </div>

          <div>
            <Label className="text-xs">{t("common:description", { defaultValue: "Description" })}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder={t("common:asset_desc_hint")} className="text-sm min-h-[60px]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t("common:asset_type")}</Label>
              <Select value={assetType} onValueChange={setAssetType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t("common:tags_comma")}</Label>
              <Input value={tags} onChange={e => setTags(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
            <h4 className="text-xs font-semibold flex items-center gap-1.5">
              {t("common:pricing")} <Badge variant="outline" className="text-[8px]">Root2</Badge>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> {t("common:price_usd")}
                </Label>
                <Input value={priceUsd} onChange={e => setPriceUsd(e.target.value)}
                  className={`h-8 text-sm font-mono ${usdValid ? "border-primary/50" : "border-destructive/50"}`} />
                {!usdValid && usdNum > 0 && (
                  <p className="text-[9px] text-destructive mt-0.5">
                    {t("common:not_root2_suggestion", { suggestion: nearestRoot2(usdNum) })}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-[10px] flex items-center gap-1">
                  <Coins className="h-3 w-3" /> {t("common:price_neurons")}
                </Label>
                <Input value={priceNeurons} onChange={e => setPriceNeurons(e.target.value)}
                  className={`h-8 text-sm font-mono ${neuronsValid ? "border-primary/50" : "border-destructive/50"}`} />
                {!neuronsValid && neuronsNum > 0 && (
                  <p className="text-[9px] text-destructive mt-0.5">
                    {t("common:not_root2_suggestion", { suggestion: nearestRoot2(neuronsNum) })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-background rounded-md px-2.5 py-1.5">
              <Info className="h-3 w-3 shrink-0" />
              <span>{t("common:revenue_split")}: <strong className="text-foreground">${creatorRevenue}</strong> {t("common:creator")} (70%) · <strong>${platformFee}</strong> {t("common:platform")} (30%)</span>
            </div>
          </div>

          {/* Preview content */}
          <div>
            <Label className="text-xs">{t("common:preview_free")}</Label>
            <Textarea value={previewContent} onChange={e => setPreviewContent(e.target.value)}
              className="text-xs min-h-[60px]" placeholder={t("common:preview_hint")} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>{t("common:cancel")}</Button>
          <Button size="sm" onClick={handlePublish} disabled={publishing || !title.trim()} className="gap-1.5">
            <Store className="h-3.5 w-3.5" />
            {publishing ? t("common:publishing") : t("common:publish_marketplace")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}