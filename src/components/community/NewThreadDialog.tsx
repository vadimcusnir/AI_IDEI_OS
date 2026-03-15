import { useState } from "react";
import { useCreateThread } from "@/hooks/useForum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface NewThreadDialogProps {
  categoryId: string;
  onSuccess: () => void;
}

export function NewThreadDialog({ categoryId, onSuccess }: NewThreadDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const createThread = useCreateThread();

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    await createThread.mutateAsync({ categoryId, title: title.trim(), content: content.trim() });
    setTitle("");
    setContent("");
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
          <Textarea
            placeholder="Describe your question or topic..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
          />
          <p className="text-[10px] text-muted-foreground">
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
