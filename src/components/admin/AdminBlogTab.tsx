import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Eye, Edit2, Trash2, Send, Clock, FileText, Loader2, RefreshCw } from "lucide-react";

const CATEGORIES = [
  "knowledge-extraction", "ai-strategy", "content-intelligence",
  "cognitive-frameworks", "digital-economics", "creator-systems",
];

export function AdminBlogTab() {
  const queryClient = useQueryClient();
  const [editingPost, setEditingPost] = useState<any>(null);
  const [generateTopic, setGenerateTopic] = useState("");
  const [generateCategory, setGenerateCategory] = useState("insights");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (params: { topic?: string; category?: string; schedule_hours?: number }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(params),
        }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || "Generation failed");
      }
      return resp.json();
    },
    onSuccess: (data) => {
      toast.success(`Blog post generated: ${data.post?.title || "Success"}`);
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (post: { id: string; title?: string; excerpt?: string; content?: string; status?: string; category?: string }) => {
      const updateData: any = { ...post };
      delete updateData.id;
      if (post.status === "published" && !updateData.published_at) {
        updateData.published_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("blog_posts")
        .update(updateData)
        .eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post updated");
      setEditingPost(null);
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
  });

  const statusColor = (s: string) => {
    switch (s) {
      case "published": return "default";
      case "scheduled": return "secondary";
      case "draft": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate new post */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="w-4 h-4" /> Generate Blog Post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Topic (optional — random if empty)"
              value={generateTopic}
              onChange={(e) => setGenerateTopic(e.target.value)}
              className="flex-1"
            />
            <Select value={generateCategory} onValueChange={setGenerateCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c.replace("-", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => generateMutation.mutate({
                topic: generateTopic || undefined,
                category: generateCategory,
              })}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Generating...</>
              ) : (
                <><Plus className="w-4 h-4 mr-1" /> Generate</>
              )}
            </Button>
          </div>
          {generateMutation.isPending && (
            <p className="text-xs text-muted-foreground mt-2">
              Generating article + images. This may take 30-60 seconds...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Posts list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Blog Posts ({posts?.length || 0})
            </span>
            <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] })}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !posts?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No blog posts yet. Generate one above.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={statusColor(post.status)}>{post.status}</Badge>
                      <Badge variant="outline" className="text-xs">{(post.category as string)}</Badge>
                    </div>
                    <h3 className="font-medium text-sm text-foreground truncate">{post.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{post.excerpt}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      <span>{post.word_count} words</span>
                      <span>{post.reading_time_min} min read</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      {post.scheduled_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Scheduled: {new Date(post.scheduled_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {post.status === "draft" && (
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => updateMutation.mutate({ id: post.id, status: "published" })}
                        title="Publish"
                      >
                        <Send className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setEditingPost({ ...post })} title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Post</DialogTitle>
                        </DialogHeader>
                        {editingPost && (
                          <div className="space-y-4">
                            <Input
                              value={editingPost.title}
                              onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                              placeholder="Title"
                            />
                            <Input
                              value={editingPost.excerpt}
                              onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                              placeholder="Excerpt"
                            />
                            <Select
                              value={editingPost.status}
                              onValueChange={(v) => setEditingPost({ ...editingPost, status: v })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                              </SelectContent>
                            </Select>
                            <Textarea
                              value={editingPost.content}
                              onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                              rows={15}
                              className="font-mono text-xs"
                            />
                            <Button
                              onClick={() => updateMutation.mutate({
                                id: editingPost.id,
                                title: editingPost.title,
                                excerpt: editingPost.excerpt,
                                content: editingPost.content,
                                status: editingPost.status,
                              })}
                              disabled={updateMutation.isPending}
                            >
                              Save Changes
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => {
                        if (confirm("Delete this post?")) deleteMutation.mutate(post.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
