import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePost, useForumVote, useMarkSolution, ForumPost } from "@/hooks/useForum";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ReportDialog } from "@/components/community/ReportDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronUp, ChevronDown, CheckCircle2,
  Award, Send, Reply, CornerDownRight,
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

interface PostCardProps {
  post: ForumPost;
  threadAuthorId: string;
  threadId: string;
  replies?: ForumPost[];
  depth?: number;
}

export function PostCard({ post, threadAuthorId, threadId, replies = [], depth = 0 }: PostCardProps) {
  const { user } = useAuth();
  const markSolution = useMarkSolution();
  const createPost = useCreatePost();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  const authorName = post.author_profile?.display_name || "User";
  const karma = post.author_karma?.karma || 0;
  const canMarkSolution = user?.id === threadAuthorId && !post.is_solution;
  const maxDepth = 3;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await createPost.mutateAsync({ threadId, content: replyText.trim(), replyToId: post.id });
    setReplyText("");
    setShowReply(false);
  };

  // Render @mentions as highlighted spans
  const renderContent = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) =>
      part.startsWith("@") ? (
        <span key={i} className="text-primary font-medium bg-primary/10 rounded px-0.5">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className={depth > 0 ? "ml-4 md:ml-6 border-l-2 border-border pl-3" : ""}>
      <div className={`flex gap-3 p-3 rounded-lg ${post.is_solution ? "bg-status-validated/5 border border-status-validated/20" : ""}`}>
        <VoteButtons targetType="post" targetId={post.id} score={post.vote_score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-nano">{authorName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">{authorName}</span>
            <Badge variant="outline" className="text-nano px-1 py-0">
              <Award className="h-2.5 w-2.5 mr-0.5" />{karma}
            </Badge>
            <span className="text-micro text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
            {post.is_solution && (
              <Badge className="text-nano px-1.5 py-0 bg-status-validated/15 text-status-validated border-status-validated/30">
                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Solution
              </Badge>
            )}
          </div>

          <div className="prose-compact whitespace-pre-wrap">{renderContent(post.content)}</div>

          <div className="flex items-center gap-2 mt-2">
            {canMarkSolution && (
              <Button
                variant="outline"
                size="sm"
                className="text-micro h-6"
                onClick={() => markSolution.mutate({ threadId, postId: post.id })}
                disabled={markSolution.isPending}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />Mark as Solution
              </Button>
            )}
            {user && depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                className="text-micro h-6 text-muted-foreground"
                onClick={() => setShowReply(!showReply)}
              >
                <Reply className="h-3 w-3 mr-1" />Reply
              </Button>
            )}
            <ReportDialog targetType="post" targetId={post.id} />
          </div>

          {/* Inline reply form */}
          {showReply && (
            <div className="mt-2 flex gap-2">
              <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground mt-2 shrink-0" />
              <div className="flex-1">
                <Textarea
                  placeholder={`Reply to ${authorName}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  className="text-xs mb-1.5"
                />
                <div className="flex gap-1.5">
                  <Button size="sm" className="text-micro h-6" onClick={handleReply} disabled={createPost.isPending || !replyText.trim()}>
                    <Send className="h-3 w-3 mr-1" />{createPost.isPending ? "..." : "Reply"}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-micro h-6" onClick={() => { setShowReply(false); setReplyText(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="mt-1 space-y-1">
          {replies.map((child) => (
            <PostCard
              key={child.id}
              post={child}
              threadAuthorId={threadAuthorId}
              threadId={threadId}
              replies={[]} // deeper nesting handled by parent tree builder
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
