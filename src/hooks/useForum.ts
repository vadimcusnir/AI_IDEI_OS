import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import i18next from "i18next";

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  position: number;
  is_active: boolean;
  thread_count: number;
  post_count: number;
}

export interface ForumThread {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_solved: boolean;
  view_count: number;
  reply_count: number;
  vote_score: number;
  last_activity_at: string;
  created_at: string;
  author_profile?: { display_name: string | null; avatar_url: string | null };
}

export interface ForumPost {
  id: string;
  thread_id: string;
  author_id: string;
  content: string;
  is_solution: boolean;
  vote_score: number;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  author_profile?: { display_name: string | null; avatar_url: string | null };
  author_karma?: { karma: number };
}

export interface UserKarma {
  user_id: string;
  karma: number;
  threads_created: number;
  posts_created: number;
  solutions_given: number;
}

export function useForumCategories() {
  return useQuery({
    queryKey: ["forum-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_categories")
        .select("*")
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return data as ForumCategory[];
    },
  });
}

export function useForumThreads(categorySlug: string | undefined) {
  return useQuery({
    queryKey: ["forum-threads", categorySlug],
    queryFn: async () => {
      if (!categorySlug) return [];
      
      // Get category id first
      const { data: cat } = await supabase
        .from("forum_categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();
      if (!cat) return [];

      const { data, error } = await supabase
        .from("forum_threads")
        .select("*")
        .eq("category_id", cat.id)
        .order("is_pinned", { ascending: false })
        .order("last_activity_at", { ascending: false })
        .limit(50);
      if (error) throw error;

      // Fetch author profiles
      const authorIds = [...new Set((data || []).map((t: any) => t.author_id))];
      const { data: profiles } = await supabase
        .from("profiles_public" as any)
        .select("user_id, display_name, avatar_url")
        .in("user_id", authorIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      return (data || []).map((t: any) => ({
        ...t,
        author_profile: profileMap.get(t.author_id) || null,
      })) as ForumThread[];
    },
    enabled: !!categorySlug,
  });
}

export function useForumThread(threadId: string | undefined) {
  return useQuery({
    queryKey: ["forum-thread", threadId],
    queryFn: async () => {
      if (!threadId) return null;
      const { data, error } = await supabase
        .from("forum_threads")
        .select("*")
        .eq("id", threadId)
        .single();
      if (error) throw error;

      // Get author profile
      const { data: profile } = await supabase
        .from("profiles_public" as any)
        .select("user_id, display_name, avatar_url")
        .eq("user_id", data.author_id)
        .single();

      return { ...data, author_profile: profile } as ForumThread;
    },
    enabled: !!threadId,
  });
}

export function useForumPosts(threadId: string | undefined) {
  return useQuery({
    queryKey: ["forum-posts", threadId],
    queryFn: async () => {
      if (!threadId) return [];
      const { data, error } = await supabase
        .from("forum_posts")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at");
      if (error) throw error;

      // Fetch author profiles and karma
      const authorIds = [...new Set((data || []).map((p: any) => p.author_id))];
      const [{ data: profiles }, { data: karmas }] = await Promise.all([
        supabase.from("profiles_public" as any).select("user_id, display_name, avatar_url").in("user_id", authorIds),
        supabase.from("user_karma").select("user_id, karma").in("user_id", authorIds),
      ]);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const karmaMap = new Map((karmas || []).map((k: any) => [k.user_id, k]));

      return (data || []).map((p: any) => ({
        ...p,
        author_profile: profileMap.get(p.author_id) || null,
        author_karma: karmaMap.get(p.author_id) || { karma: 0 },
      })) as ForumPost[];
    },
    enabled: !!threadId,
  });
}

export function useCreateThread() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ categoryId, title, content, tags }: { categoryId: string; title: string; content: string; tags?: string[] }) => {
      if (!user) throw new Error("Not authenticated");
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
      const { data, error } = await supabase
        .from("forum_threads")
        .insert({ category_id: categoryId, author_id: user.id, title, slug: `${slug}-${Date.now()}`, content, tags: tags || [] } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forum-threads"] });
      qc.invalidateQueries({ queryKey: ["forum-categories"] });
      toast.success(i18next.t("common:thread_created"));
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ threadId, content, replyToId }: { threadId: string; content: string; replyToId?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("forum_posts")
        .insert({ thread_id: threadId, author_id: user.id, content, reply_to_id: replyToId || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["forum-posts", vars.threadId] });
      qc.invalidateQueries({ queryKey: ["forum-thread", vars.threadId] });
      toast.success(i18next.t("common:reply_posted"));
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useForumVote() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetType, targetId, voteValue }: { targetType: string; targetId: string; voteValue: number }) => {
      const { data, error } = await supabase.rpc("forum_vote", {
        _target_type: targetType,
        _target_id: targetId,
        _vote_value: voteValue,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forum-threads"] });
      qc.invalidateQueries({ queryKey: ["forum-posts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useMarkSolution() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, postId }: { threadId: string; postId: string }) => {
      const { data, error } = await supabase.rpc("forum_mark_solution", {
        _thread_id: threadId,
        _post_id: postId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["forum-posts", vars.threadId] });
      qc.invalidateQueries({ queryKey: ["forum-thread", vars.threadId] });
      toast.success(i18next.t("common:solution_marked"));
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUserKarma(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-karma", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("user_karma")
        .select("*")
        .eq("user_id", userId)
        .single();
      return (data as UserKarma) || { user_id: userId, karma: 0, threads_created: 0, posts_created: 0, solutions_given: 0 };
    },
    enabled: !!userId,
  });
}
