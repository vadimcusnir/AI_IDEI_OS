import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Pin, Lock, CheckCircle2, ChevronUp, ChevronDown,
  Clock, Eye, MessageCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ForumThread } from "@/hooks/useForum";

interface ThreadRowProps {
  thread: ForumThread;
  onClick: () => void;
}

export function ThreadRow({ thread, onClick }: ThreadRowProps) {
  const authorName = thread.author_profile?.display_name || "User";
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-all border border-transparent hover:border-border hover:shadow-sm"
      onClick={onClick}
    >
      <div className="flex flex-col items-center gap-1 min-w-[40px] text-center">
        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">{thread.vote_score}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
        <AvatarFallback className="text-nano bg-primary/10 text-primary">
          {authorName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {thread.is_pinned && <Pin className="h-3 w-3 text-primary" />}
          {thread.is_locked && <Lock className="h-3 w-3 text-muted-foreground" />}
          {thread.is_solved && (
            <Badge variant="outline" className="text-nano px-1 py-0 border-status-validated text-status-validated">
              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Solved
            </Badge>
          )}
          <h4 className="font-medium text-sm truncate">{thread.title}</h4>
          {(thread as any).tags?.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-nano px-1 py-0">{tag}</Badge>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1 text-micro text-muted-foreground">
          <span className="font-medium text-foreground/70">{authorName}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
          </span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <MessageCircle className="h-2.5 w-2.5" />{thread.reply_count}
          </span>
          <span className="flex items-center gap-0.5">
            <Eye className="h-2.5 w-2.5" />{thread.view_count}
          </span>
        </div>
      </div>
    </div>
  );
}
