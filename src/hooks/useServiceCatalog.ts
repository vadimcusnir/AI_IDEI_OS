import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ServiceL3, ServiceL2, ServiceL1, ServiceCatalog } from "@/types/services";

async function fetchL3(): Promise<ServiceL3[]> {
  const { data, error } = await supabase
    .from("services_level_3_public" as any)
    .select("id, service_name, service_slug, category, subcategory, description_public, price_usd, deliverable_name, deliverable_type, estimated_delivery_seconds, status, visibility, created_at, updated_at")
    .eq("status", "active")
    .eq("visibility", "public")
    .order("price_usd", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((d: any) => ({ ...d, level: "L3" as const, price_usd: Number(d.price_usd) }));
}

async function fetchL2(): Promise<ServiceL2[]> {
  const { data, error } = await supabase
    .from("services_level_2_public" as any)
    .select("id, service_name, service_slug, category, subcategory, description_public, price_usd, deliverable_name, deliverable_type, estimated_delivery_seconds, status, visibility, created_at, updated_at")
    .eq("status", "active")
    .eq("visibility", "public")
    .order("price_usd", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((d: any) => ({ ...d, level: "L2" as const, price_usd: Number(d.price_usd) }));
}

async function fetchL1(): Promise<ServiceL1[]> {
  const { data, error } = await supabase
    .from("services_level_1_public" as any)
    .select("id, service_name, service_slug, category, subcategory, description_public, price_usd, deliverable_name, deliverable_type, estimated_delivery_seconds, status, visibility, created_at, updated_at")
    .eq("status", "active")
    .eq("visibility", "public")
    .order("price_usd", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((d: any) => ({ ...d, level: "L1" as const, price_usd: Number(d.price_usd) }));
}

export function useServiceCatalog() {
  return useQuery<ServiceCatalog>({
    queryKey: ["service-catalog"],
    queryFn: async () => {
      const [l3, l2, l1] = await Promise.all([fetchL3(), fetchL2(), fetchL1()]);
      return { l3, l2, l1 };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useServiceBySlug(level: "L1" | "L2" | "L3", slug: string) {
  const table = level === "L3" ? "services_level_3_public" : level === "L2" ? "services_level_2_public" : "services_level_1_public";
  return useQuery({
    queryKey: ["service", level, slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table as any)
        .select("*")
        .eq("service_slug", slug)
        .single();
      if (error) throw error;
      return { ...(data as any), level, price_usd: Number((data as any).price_usd) };
    },
    enabled: !!slug,
  });
}
