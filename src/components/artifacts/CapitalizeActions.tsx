/**
 * CapitalizeActions — One-click save artifact to library or publish to marketplace.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, Store, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  artifactId: string;
  title: string;
  content: string;
  artifactType: string;
}

export function CapitalizeActions({ artifactId, title, content, artifactType }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [published, setPublished] = useState(false);

  const handleSaveToLibrary = async () => {
    if (!user || saved) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("artifacts").update({
        status: "published",
        tags: ["capitalized", "from-job", artifactType],
      }).eq("id", artifactId);

      if (error) throw error;
      setSaved(true);
      toast.success("Salvat în Bibliotecă!");
    } catch {
      toast.error("Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToMarketplace = async () => {
    if (!user || published) return;
    setPublishing(true);
    try {
      // Create marketplace asset draft
      const { error } = await supabase.from("knowledge_assets").insert({
        creator_id: user.id,
        title,
        description: content.slice(0, 200) + "...",
        content,
        asset_type: artifactType === "document" ? "framework" : artifactType,
        price_neurons: 100,
        is_published: false,
        source_artifact_id: artifactId,
      } as any);

      if (error) throw error;
      setPublished(true);
      toast.success("Draft creat în Marketplace!", {
        action: { label: "Vezi drafturi", onClick: () => navigate("/marketplace/drafts") },
      });
    } catch {
      toast.error("Eroare la publicare");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-micro gap-1"
        onClick={handleSaveToLibrary}
        disabled={saving || saved}
      >
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : saved ? <Check className="h-3 w-3 text-status-validated" /> : <BookmarkPlus className="h-3 w-3" />}
        {saved ? "Salvat" : "Bibliotecă"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-micro gap-1"
        onClick={handlePublishToMarketplace}
        disabled={publishing || published}
      >
        {publishing ? <Loader2 className="h-3 w-3 animate-spin" /> : published ? <Check className="h-3 w-3 text-status-validated" /> : <Store className="h-3 w-3" />}
        {published ? "Publicat" : "Marketplace"}
      </Button>
    </div>
  );
}
