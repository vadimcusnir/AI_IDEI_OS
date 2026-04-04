import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

interface BucketUsage {
  bucket_id: string;
  file_count: number;
  total_bytes: number;
}

interface StorageLimit {
  tier: string;
  max_bytes: number;
  max_files: number;
  description: string;
}

export function useStorageUsage() {
  const { user } = useAuth();
  const { tier } = useSubscription();

  const effectiveTier = tier ?? "free";

  const usageQuery = useQuery({
    queryKey: ["storage-usage", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.rpc("get_user_storage_usage", {
        p_user_id: user.id,
      });
      if (error) throw error;
      return (data as BucketUsage[]) ?? [];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const limitsQuery = useQuery({
    queryKey: ["storage-limits", effectiveTier],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_limits")
        .select("*")
        .eq("tier", effectiveTier)
        .single();
      if (error) throw error;
      return data as StorageLimit;
    },
    enabled: !!effectiveTier,
    staleTime: 300_000,
  });

  const buckets = usageQuery.data ?? [];
  const totalBytes = buckets.reduce((s, b) => s + b.total_bytes, 0);
  const totalFiles = buckets.reduce((s, b) => s + b.file_count, 0);
  const limit = limitsQuery.data;

  const usagePercent = limit ? Math.min((totalBytes / limit.max_bytes) * 100, 100) : 0;
  const filesPercent = limit ? Math.min((totalFiles / limit.max_files) * 100, 100) : 0;

  return {
    buckets,
    totalBytes,
    totalFiles,
    limit,
    usagePercent,
    filesPercent,
    loading: usageQuery.isLoading || limitsQuery.isLoading,
    error: usageQuery.error || limitsQuery.error,
    refetch: usageQuery.refetch,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
