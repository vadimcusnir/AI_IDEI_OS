import { useState } from "react";
import { useCreateThread } from "@/hooks/useForum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { MentionTextarea } from "@/components/community/MentionTextarea";

const SUGGESTED_TAGS = ["question", "discussion", "tutorial", "bug", "feature-request", "showcase"];

interface NewThreadDialogProps {
  categoryId: string;
  onSuccess: () => void;
}

export function NewThreadDialog({ categoryId, onSuccess }: NewThreadDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const createThread = useCreateThread();

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag].slice(0, 4));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    await createThread.mutateAsync({ categoryId, title: title.trim(), content: content.trim(), tags });
    setTitle("");
    setContent("");
    setTags([]);
    setOpen(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />New Thread</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Thread</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Thread title..." value={title} onChange={(e) => setTitle(e.target.value)} />
          <MentionTextarea
            placeholder="Describe your question or topic... Use @name to mention users"
            value={content}
            onChange={setContent}
            rows={6}
          />
          <div>
            <p className="text-micro text-muted-foreground mb-1.5">Tags (max 4):</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={tags.includes(tag) ? "default" : "outline"}
                  className="text-micro cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {tags.includes(tag) && <X className="h-2.5 w-2.5 ml-0.5" />}
                </Badge>
              ))}
            </div>
          </div>
          <p className="text-micro text-muted-foreground">
            💡 Creating a thread earns you <strong>+1 karma</strong>. Provide details to get better answers!
          </p>
          <Button
            onClick={handleSubmit}
            disabled={createThread.isPending || !title.trim() || !content.trim()}
            className="w-full"
          >
            {createThread.isPending ? "Posting..." : "Post Thread"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
