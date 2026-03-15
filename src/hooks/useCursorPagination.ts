import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Generic cursor-based pagination hook for Supabase tables.
 * Uses created_at + id as cursor for deterministic ordering.
 */
interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface UseCursorPaginationOptions {
  table: string;
  pageSize?: number;
  orderColumn?: string;
  ascending?: boolean;
  /** Supabase select string, e.g. "id, title, created_at" */
  select?: string;
  /** Additional filters as [column, operator, value] tuples */
  filters?: [string, string, unknown][];
  queryKey: string[];
  enabled?: boolean;
}

export function useCursorPagination<T = Record<string, unknown>>({
  table,
  pageSize = 25,
  orderColumn = "created_at",
  ascending = false,
  select = "*",
  filters = [],
  queryKey,
  enabled = true,
}: UseCursorPaginationOptions) {
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);

  const currentCursor = cursors[pageIndex] ?? null;

  const query = useQuery<CursorPage<T>>({
    queryKey: [...queryKey, "cursor", currentCursor, pageSize],
    enabled,
    queryFn: async () => {
      let q = (supabase.from(table) as any)
        .select(select)
        .order(orderColumn, { ascending })
        .limit(pageSize + 1); // fetch one extra to detect hasMore

      // Apply filters
      for (const [col, op, val] of filters) {
        q = q.filter(col, op, val);
      }

      // Apply cursor (use range-based for simplicity)
      if (currentCursor) {
        q = ascending
          ? q.gt(orderColumn, currentCursor)
          : q.lt(orderColumn, currentCursor);
      }

      const { data, error } = await q;
      if (error) throw error;

      const rows = (data as T[]) || [];
      const hasMore = rows.length > pageSize;
      const page = hasMore ? rows.slice(0, pageSize) : rows;

      const nextCursor = page.length > 0
        ? (page[page.length - 1] as any)[orderColumn]
        : null;

      return { data: page, nextCursor, hasMore };
    },
  });

  const goNext = useCallback(() => {
    if (query.data?.hasMore && query.data.nextCursor) {
      const next = pageIndex + 1;
      setCursors((prev) => {
        const copy = [...prev];
        copy[next] = query.data!.nextCursor;
        return copy;
      });
      setPageIndex(next);
    }
  }, [query.data, pageIndex]);

  const goPrev = useCallback(() => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    }
  }, [pageIndex]);

  const goFirst = useCallback(() => {
    setPageIndex(0);
    setCursors([null]);
  }, []);

  return {
    data: query.data?.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    hasNextPage: query.data?.hasMore ?? false,
    hasPrevPage: pageIndex > 0,
    pageIndex,
    goNext,
    goPrev,
    goFirst,
  };
}
