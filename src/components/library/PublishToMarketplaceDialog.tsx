import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Store, Coins, Copy, ExternalLink, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
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
import { toast } from "sonner";
import { runPublishGates } from "@/lib/marketplaceGates";

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

const CATEGORIES = [
  { value: "template", label: "Template" },
  { value: "framework", label: "Framework" },
  { value: "course", label: "Curs" },
  { value: "bundle", label: "Pachet" },
  { value: "report", label: "Raport" },
  { value: "copy", label: "Copywriting" },
];

export function PublishToMarketplaceDialog({ open, onOpenChange, artifact }: PublishToMarketplaceDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(artifact.title);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("template");
  const [priceNeurons, setPriceNeurons] = useState("200");
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const neuronsNum = Number(priceNeurons) || 0;
  const priceUsd = (neuronsNum * 0.002).toFixed(2);
  const shareUrl = publishedId
    ? `${window.location.origin}/marketplace/${publishedId}`
    : null;

  const gateResult = useMemo(() => runPublishGates({
    title,
    description,
    content: artifact.content ?? "",
    priceNeurons: neuronsNum,
    category,
  }), [title, description, artifact.content, neuronsNum, category]);

  const handlePublish = async () => {
    if (!user) return;
    if (!gateResult.passed) {
      toast.error("Verifică toate cerințele înainte de publicare.");
      return;
    }
    setPublishing(true);

    const { data, error } = await supabase.from("knowledge_assets").insert({
      author_id: user.id,
      title,
      description,
      asset_type: category,
      price_neurons: neuronsNum,
      price_usd: Number(priceUsd),
      preview_content: (artifact.content ?? "").slice(0, 300),
      tags: artifact.tags ?? [],
      artifact_ids: [artifact.id],
      is_published: true,
    }).select("id").single();

    if (!error && data) {
      // Mark source artifact as published
      await supabase.from("artifacts").update({ status: "published" }).eq("id", artifact.id);
      setPublishedId(data.id);
      toast.success("Publicat cu succes în Marketplace!");
    } else {
      toast.error(error?.message || "Eroare la publicare.");
    }
    setPublishing(false);
  };

  const copyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiat!");
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setPublishedId(null);
      setDescription("");
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" /> Publică în Marketplace
          </DialogTitle>
          <DialogDescription>
            Transformă acest livrabil într-un produs public pe care alții îl pot cumpăra.
          </DialogDescription>
        </DialogHeader>

        {publishedId ? (
          /* ═══ Success state ═══ */
          <div className="py-6 space-y-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <div>
              <h3 className="text-base font-bold">Publicat cu succes!</h3>
              <p className="text-xs text-muted-foreground mt-1">Produsul tău este acum vizibil în Marketplace.</p>
            </div>
            <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
              <Input value={shareUrl || ""} readOnly className="h-8 text-xs font-mono bg-transparent border-0 focus-visible:ring-0" />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyShareLink}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={() => handleClose(false)}>Închide</Button>
              <Button size="sm" className="gap-1.5" onClick={() => window.open(shareUrl!, "_blank")}>
                <ExternalLink className="h-3.5 w-3.5" /> Deschide
              </Button>
            </div>
          </div>
        ) : (
          /* ═══ Form state ═══ */
          <>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs">Titlu produs</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} className="h-8 text-sm" />
              </div>

              <div>
                <Label className="text-xs">Descriere scurtă</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Ce primește cumpărătorul? De ce e valoros?" className="text-sm min-h-[60px]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Categorie</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Coins className="h-3 w-3" /> Preț (NEURONS)
                  </Label>
                  <Input value={priceNeurons} onChange={e => setPriceNeurons(e.target.value)}
                    type="number" min={20} className="h-8 text-sm font-mono" />
                  <p className="text-nano text-muted-foreground mt-0.5">
                    ≈ ${priceUsd} USD
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => handleClose(false)}>Anulează</Button>
              <Button size="sm" onClick={handlePublish}
                disabled={publishing || !title.trim() || !description.trim() || neuronsNum < 20}
                className="gap-1.5">
                <Store className="h-3.5 w-3.5" />
                {publishing ? "Se publică..." : "Publică"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
