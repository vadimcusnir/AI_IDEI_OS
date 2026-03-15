import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useForumThread, useForumPosts, useCreatePost, useForumVote, useMarkSolution, ForumPost } from "@/hooks/useForum";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, ChevronUp, ChevronDown, CheckCircle2, Pin, Lock,
  MessageCircle, Clock, Award, Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function VoteButtons({ targetType, targetId, score }: { targetType: string; targetId: string; score: number }) {
  const vote = useForumVote();
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); vote.mutate({ targetType, targetId, voteValue: 1 }); }}
        className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <span className="text-xs font-bold">{score}</span>
      <button
        onClick={(e) => { e.stopPropagation(); vote.mutate({ targetType, targetId, voteValue: -1 }); }}
        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

function PostCard({ post, threadAuthorId, threadId }: { post: ForumPost; threadAuthorId: string; threadId: string }) {
  const { user } = useAuth();
  const markSolution = useMarkSolution();
  const authorName = post.author_profile?.display_name || "User";
  const karma = post.author_karma?.karma || 0;
  const canMarkSolution = user?.id === threadAuthorId && !post.is_solution;

  return (
    <div className={`flex gap-3 p-4 rounded-lg ${post.is_solution ? "bg-status-validated/5 border border-status-validated/20" : ""}`}>
      <VoteButtons targetType="post" targetId={post.id} score={post.vote_score} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">{authorName}</span>
          <Badge variant="outline" className="text-[9px] px-1 py-0">
            <Award className="h-2.5 w-2.5 mr-0.5" />{karma}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </span>
          {post.is_solution && (
            <Badge className="text-[9px] px-1.5 py-0 bg-green-500/15 text-green-600 border-green-500/30">
              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Solution
            </Badge>
          )}
        </div>
        <div className="text-sm whitespace-pre-wrap">{post.content}</div>
        {canMarkSolution && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 text-[10px] h-6"
            onClick={() => markSolution.mutate({ threadId, postId: post.id })}
            disabled={markSolution.isPending}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />Mark as Solution
          </Button>
        )}
      </div>
    </div>
  );
}

export default function CommunityThread() {
  const { threadId, category } = useParams<{ threadId: string; category: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: thread, isLoading: threadLoading } = useForumThread(threadId);
  const { data: posts, isLoading: postsLoading } = useForumPosts(threadId);
  const createPost = useCreatePost();
  const [reply, setReply] = useState("");

  const handleReply = async () => {
    if (!reply.trim() || !threadId) return;
    await createPost.mutateAsync({ threadId, content: reply.trim() });
    setReply("");
  };

  if (threadLoading) {
    return (
      <PageTransition>
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32" />
          <Skeleton className="h-24" />
        </div>
      </PageTransition>
    );
  }

  if (!thread) {
    return (
      <PageTransition>
        <div className="p-4 md:p-6 max-w-4xl mx-auto text-center py-20">
          <p className="text-muted-foreground">Thread not found.</p>
          <Button variant="link" onClick={() => navigate("/community")}>Back to Community</Button>
        </div>
      </PageTransition>
    );
  }

  const authorName = thread.author_profile?.display_name || "User";

  return (
    <PageTransition>
      <SEOHead title={`${thread.title} — Community`} description={thread.content.slice(0, 160)} />
      <div className="flex-1 overflow-auto p-4 md:p-6 max-w-4xl mx-auto">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(`/community/${category}`)}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back
        </Button>

        {/* Thread header */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <VoteButtons targetType="thread" targetId={thread.id} score={thread.vote_score} />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {thread.is_pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                  {thread.is_locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  {thread.is_solved && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-green-500 text-green-600">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Solved
                    </Badge>
                  )}
                  <h1 className="text-lg font-bold">{thread.title}</h1>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[8px]">{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{authorName}</span>
                  <span>·</span>
                  <Clock className="h-2.5 w-2.5" />
                  <span>{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</span>
                  <span>·</span>
                  <MessageCircle className="h-2.5 w-2.5" />
                  <span>{thread.reply_count} replies</span>
                </div>
                <div className="text-sm whitespace-pre-wrap">{thread.content}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        <div className="space-y-2 mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {thread.reply_count} {thread.reply_count === 1 ? "Reply" : "Replies"}
          </h3>
          {postsLoading ? (
            [1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} threadAuthorId={thread.author_id} threadId={thread.id} />
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">No replies yet. Be the first to answer!</p>
          )}
        </div>

        {/* Reply box */}
        {user && !thread.is_locked ? (
          <Card>
            <CardContent className="p-4">
              <Textarea
                placeholder="Write your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                className="mb-3"
              />
              <Button
                onClick={handleReply}
                disabled={createPost.isPending || !reply.trim()}
                size="sm"
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                {createPost.isPending ? "Posting..." : "Post Reply"}
              </Button>
            </CardContent>
          </Card>
        ) : thread.is_locked ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            <Lock className="h-3.5 w-3.5 inline mr-1" />This thread is locked.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            <a href="/auth" className="text-primary hover:underline">Sign in</a> to reply.
          </p>
        )}
      </div>
    </PageTransition>
  );
}
