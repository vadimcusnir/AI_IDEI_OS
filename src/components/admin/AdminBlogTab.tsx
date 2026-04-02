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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, Eye, Edit2, Trash2, Send, Clock, FileText,
  Loader2, RefreshCw, Image, BookOpen, AlertTriangle,
  CheckCircle, XCircle, RotateCcw,
} from "lucide-react";

const CATEGORIES = [
  "knowledge-extraction", "ai-strategy", "content-intelligence",
  "cognitive-frameworks", "digital-economics", "creator-systems",
];

export function AdminBlogTab() {
  const queryClient = useQueryClient();
  const [editingPost, setEditingPost] = useState<any>(null);
  const [generateTopic, setGenerateTopic] = useState("");
  const [generateCategory, setGenerateCategory] = useState("knowledge-extraction");
  const [activeTab, setActiveTab] = useState("posts");

  // ═══ POSTS QUERY ═══
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

  // ═══ TOPICS QUERY ═══
  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ["admin-blog-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_topics")
        .select("*")
        .order("priority", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "topics",
  });

  // ═══ GENERATE MUTATION ═══
  const generateMutation = useMutation({
    mutationFn: async (params: { topic?: string; category?: string; topic_id?: string; schedule_hours?: number }) => {
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
      queryClient.invalidateQueries({ queryKey: ["admin-blog-topics"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ═══ UPDATE MUTATION ═══
  const updateMutation = useMutation({
    mutationFn: async (post: { id: string; title?: string; excerpt?: string; content?: string; status?: string; category?: string }) => {
      const updateData: any = { ...post };
      delete updateData.id;
      if (post.status === "published" && !updateData.published_at) {
        updateData.published_at = new Date().toISOString();
      }
      const { error } = await supabase.from("blog_posts").update(updateData).eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post updated");
      setEditingPost(null);
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ═══ DELETE MUTATION ═══
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

  // ═══ TOPIC RESET ═══
  const resetTopicMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blog_topics")
        .update({ status: "pending", generated_post_id: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Topic reset to pending");
      queryClient.invalidateQueries({ queryKey: ["admin-blog-topics"] });
    },
  });

  const statusColor = (s: string) => {
    switch (s) {
      case "published": return "default";
      case "scheduled": return "secondary";
      case "draft": return "outline";
      case "completed": return "default";
      case "failed": return "destructive";
      default: return "outline";
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case "published": case "completed": return <CheckCircle className="w-3 h-3 text-primary" />;
      case "failed": return <XCircle className="w-3 h-3 text-destructive" />;
      case "scheduled": case "processing": return <Clock className="w-3 h-3 text-accent-foreground" />;
      default: return <FileText className="w-3 h-3 text-muted-foreground" />;
    }
  };

  // Stats
  const totalPosts = posts?.length || 0;
  const published = posts?.filter(p => p.status === "published").length || 0;
  const drafts = posts?.filter(p => p.status === "draft").length || 0;
  const scheduled = posts?.filter(p => p.status === "scheduled").length || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: totalPosts, icon: FileText },
          { label: "Published", value: published, icon: CheckCircle },
          { label: "Drafts", value: drafts, icon: Edit2 },
          { label: "Scheduled", value: scheduled, icon: Clock },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="w-4 h-4" /> Generate Blog Post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Topic (optional — picks from topic bank if empty)"
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
                  <SelectItem key={c} value={c}>{c.split("-").join(" ")}</SelectItem>
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
              Pipeline: Normalize → Plan → Render → Validate → Images. ~30-90 seconds...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Posts / Topics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts" className="gap-1">
            <FileText className="w-3.5 h-3.5" /> Posts
          </TabsTrigger>
          <TabsTrigger value="topics" className="gap-1">
            <BookOpen className="w-3.5 h-3.5" /> Topic Bank
          </TabsTrigger>
        </TabsList>

        {/* ═══ POSTS TAB ═══ */}
        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Blog Posts ({totalPosts})</span>
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
                <p className="text-sm text-muted-foreground text-center py-8">No blog posts yet.</p>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                    >
                      {/* Thumbnail preview */}
                      {post.thumbnail_url && (
                        <img
                          src={post.thumbnail_url}
                          alt=""
                          className="w-20 h-14 object-cover rounded-md border border-border shrink-0"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {statusIcon(post.status)}
                          <Badge variant={statusColor(post.status)}>{post.status}</Badge>
                          <Badge variant="outline" className="text-xs">{post.category}</Badge>
                          {post.inline_images && Array.isArray(post.inline_images) && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Image className="w-3 h-3" /> {(post.inline_images as any[]).length} images
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-sm text-foreground truncate">{post.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{post.excerpt}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                          <span>{post.word_count} words</span>
                          <span>{post.reading_time_min} min</span>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          {post.pipeline_stage && (
                            <span className="text-primary">{post.pipeline_stage}</span>
                          )}
                          {post.scheduled_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(post.scheduled_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {/* Inline images preview */}
                        {post.inline_images && Array.isArray(post.inline_images) && (post.inline_images as any[]).length > 0 && (
                          <div className="flex gap-2 mt-2 overflow-x-auto">
                            {(post.inline_images as any[]).slice(0, 4).map((img: any, i: number) => (
                              <img
                                key={i}
                                src={img.url}
                                alt={img.prompt || ""}
                                className="w-16 h-12 object-cover rounded border border-border shrink-0"
                                loading="lazy"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {post.status === "draft" && (
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => updateMutation.mutate({ id: post.id, status: "published" })}
                            title="Publish"
                          >
                            <Send className="w-4 h-4 text-primary" />
                          </Button>
                        )}
                        {post.status === "published" && (
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => updateMutation.mutate({ id: post.id, status: "draft" })}
                            title="Unpublish"
                          >
                            <XCircle className="w-4 h-4 text-accent-foreground" />
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
                            {editingPost && editingPost.id === post.id && (
                              <div className="space-y-4">
                                <Input
                                  value={editingPost.title}
                                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                                  placeholder="Title"
                                />
                                <Input
                                  value={editingPost.excerpt || ""}
                                  onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                                  placeholder="Excerpt"
                                />
                                <div className="grid grid-cols-2 gap-3">
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
                                  <Select
                                    value={editingPost.category || ""}
                                    onValueChange={(v) => setEditingPost({ ...editingPost, category: v })}
                                  >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {CATEGORIES.map(c => (
                                        <SelectItem key={c} value={c}>{c.split("-").join(" ")}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {/* Image previews in editor */}
                                {editingPost.thumbnail_url && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Thumbnail</p>
                                    <img src={editingPost.thumbnail_url} alt="" className="w-full max-w-sm h-auto rounded-lg border border-border" />
                                  </div>
                                )}
                                {editingPost.inline_images && Array.isArray(editingPost.inline_images) && (editingPost.inline_images as any[]).length > 0 && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Inline Images ({(editingPost.inline_images as any[]).length})</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {(editingPost.inline_images as any[]).map((img: any, i: number) => (
                                        <div key={i} className="relative">
                                          <img src={img.url} alt={img.prompt || ""} className="w-full h-24 object-cover rounded border border-border" />
                                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{img.prompt}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
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
                                    category: editingPost.category,
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
        </TabsContent>

        {/* ═══ TOPICS TAB ═══ */}
        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Topic Bank ({topics?.length || 0})
                </span>
                <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-blog-topics"] })}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topicsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : !topics?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">No topics in bank.</p>
              ) : (
                <div className="space-y-2">
                  {/* Filter summary */}
                  <div className="flex gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
                    <span>Pending: {topics.filter(t => t.status === "pending").length}</span>
                    <span>•</span>
                    <span>Completed: {topics.filter(t => t.status === "completed").length}</span>
                    <span>•</span>
                    <span>Failed: {topics.filter(t => t.status === "failed").length}</span>
                  </div>
                  {topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {statusIcon(topic.status)}
                          <Badge variant={statusColor(topic.status)} className="text-[10px]">{topic.status}</Badge>
                          <Badge variant="outline" className="text-[10px]">{topic.category}</Badge>
                          {topic.difficulty && (
                            <Badge variant="outline" className="text-[10px]">{topic.difficulty}</Badge>
                          )}
                          {topic.priority != null && (
                            <span className="text-[10px] text-muted-foreground">P{topic.priority}</span>
                          )}
                        </div>
                        <p className="text-sm text-foreground truncate">{topic.title}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {topic.status === "pending" && (
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => generateMutation.mutate({ topic_id: topic.id, topic: topic.title, category: topic.category })}
                            disabled={generateMutation.isPending}
                            title="Generate from this topic"
                          >
                            <Send className="w-4 h-4 text-primary" />
                          </Button>
                        )}
                        {(topic.status === "failed" || topic.status === "completed") && (
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => resetTopicMutation.mutate(topic.id)}
                            title="Reset to pending"
                          >
                            <RotateCcw className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                        {topic.generated_post_id && (
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => {
                              const post = posts?.find(p => p.id === topic.generated_post_id);
                              if (post) window.open(`/blog/${post.slug}`, "_blank");
                            }}
                            title="View generated post"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
