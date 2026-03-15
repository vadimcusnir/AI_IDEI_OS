import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useForumCategories, useForumThreads, useCreateThread, ForumCategory, ForumThread } from "@/hooks/useForum";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare, Rocket, Zap, Brain, Lightbulb, Bug, Sparkles,
  ArrowLeft, Pin, Lock, CheckCircle2, ChevronUp, ChevronDown,
  Plus, Clock, Eye, MessageCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ICON_MAP: Record<string, any> = {
  "rocket": Rocket, "zap": Zap, "brain": Brain, "lightbulb": Lightbulb,
  "bug": Bug, "sparkles": Sparkles, "message-square": MessageSquare,
};

function CategoryList({ categories, onSelect }: { categories: ForumCategory[]; onSelect: (slug: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map((cat) => {
        const Icon = ICON_MAP[cat.icon] || MessageSquare;
        return (
          <Card
            key={cat.id}
            className="cursor-pointer hover:border-primary/50 transition-colors group"
            onClick={() => onSelect(cat.slug)}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{cat.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cat.description}</p>
                <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span>{cat.thread_count} threads</span>
                  <span>{cat.post_count} posts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ThreadRow({ thread, onClick }: { thread: ForumThread; onClick: () => void }) {
  const authorName = thread.author_profile?.display_name || "User";
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border"
      onClick={onClick}
    >
      <div className="flex flex-col items-center gap-1 min-w-[40px] text-center">
        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">{thread.vote_score}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {thread.is_pinned && <Pin className="h-3 w-3 text-primary" />}
          {thread.is_locked && <Lock className="h-3 w-3 text-muted-foreground" />}
          {thread.is_solved && <Badge variant="outline" className="text-[9px] px-1 py-0 border-status-validated text-status-validated"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Solved</Badge>}
          <h4 className="font-medium text-sm truncate">{thread.title}</h4>
        </div>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
          <span>{authorName}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5"><MessageCircle className="h-2.5 w-2.5" />{thread.reply_count}</span>
          <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{thread.view_count}</span>
        </div>
      </div>
    </div>
  );
}

function NewThreadDialog({ categoryId, onSuccess }: { categoryId: string; onSuccess: () => void }) {
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
          <Textarea placeholder="Describe your question or topic..." value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
          <Button onClick={handleSubmit} disabled={createThread.isPending || !title.trim() || !content.trim()} className="w-full">
            {createThread.isPending ? "Posting..." : "Post Thread"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Community() {
  const { category: categorySlug } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories, isLoading: catLoading } = useForumCategories();
  const { data: threads, isLoading: threadsLoading, refetch } = useForumThreads(categorySlug);

  const selectedCategory = categories?.find((c) => c.slug === categorySlug);

  return (
    <PageTransition>
      <SEOHead title="Community — AI-IDEI" description="Ask questions, share knowledge, and connect with the AI-IDEI community." />
      <div className="flex-1 overflow-auto p-4 md:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {categorySlug && (
            <Button variant="ghost" size="icon" onClick={() => navigate("/community")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold">{selectedCategory?.name || "Community"}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedCategory?.description || "Ask questions, share knowledge, earn karma & NEURONS"}
            </p>
          </div>
          {categorySlug && user && selectedCategory && (
            <NewThreadDialog categoryId={selectedCategory.id} onSuccess={() => refetch()} />
          )}
        </div>

        {/* Category listing */}
        {!categorySlug && (
          <>
            {catLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : (
              <CategoryList categories={categories || []} onSelect={(slug) => navigate(`/community/${slug}`)} />
            )}
          </>
        )}

        {/* Thread listing */}
        {categorySlug && (
          <Card>
            <CardContent className="p-2">
              {threadsLoading ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                </div>
              ) : threads && threads.length > 0 ? (
                <div className="divide-y divide-border">
                  {threads.map((thread) => (
                    <ThreadRow
                      key={thread.id}
                      thread={thread}
                      onClick={() => navigate(`/community/${categorySlug}/thread/${thread.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No threads yet. Be the first to start a discussion!</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
