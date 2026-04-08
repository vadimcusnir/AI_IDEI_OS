import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ServiceL3, ServiceL2, ServiceL1, ServiceCatalog } from "@/types/services";

async function fetchL3(): Promise<ServiceL3[]> {
  const { data, error } = await supabase
    .from("services_level_3")
    .select("id, service_name, service_slug, category, subcategory, description_public, price_usd, internal_credit_cost, deliverable_name, deliverable_type, estimated_delivery_seconds, status, visibility, created_at, updated_at, execution_prompt_id, formation_framework_id")
    .eq("status", "active")
    .eq("visibility", "public")
    .order("price_usd", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((d) => ({ ...d, level: "L3" as const, price_usd: Number(d.price_usd) }));
}

async function fetchL2(): Promise<ServiceL2[]> {
  const { data, error } = await supabase
    .from("services_level_2")
    .select("id, service_name, service_slug, category, subcategory, description_public, price_usd, internal_credit_cost, deliverable_name, deliverable_type, estimated_delivery_seconds, status, visibility, created_at, updated_at, execution_prompt_id, formation_framework_id, component_l3_ids, component_selection_logic, component_execution_order")
    .eq("status", "active")
    .eq("visibility", "public")
    .order("price_usd", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((d) => ({ ...d, level: "L2" as const, price_usd: Number(d.price_usd) }));
}

async function fetchL1(): Promise<ServiceL1[]> {
  const { data, error } = await supabase
    .from("services_level_1")
    .select("id, service_name, service_slug, category, subcategory, description_public, price_usd, internal_credit_cost, deliverable_name, deliverable_type, estimated_delivery_seconds, status, visibility, created_at, updated_at, execution_prompt_id, formation_framework_id, component_l2_ids, component_l3_ids_optional, final_delivery_assembly_logic, master_deliverables, output_types")
    .eq("status", "active")
    .eq("visibility", "public")
    .order("price_usd", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((d) => ({ ...d, level: "L1" as const, price_usd: Number(d.price_usd) }));
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
  const table = level === "L3" ? "services_level_3" : level === "L2" ? "services_level_2" : "services_level_1";
  return useQuery({
    queryKey: ["service", level, slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("service_slug", slug)
        .single();
      if (error) throw error;
      return { ...data, level, price_usd: Number(data.price_usd) };
    },
    enabled: !!slug,
  });
}
