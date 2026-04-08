// Service Catalog Types — L3/L2/L1 hierarchy

export type ServiceStatus = 'active' | 'inactive' | 'draft';
export type ServiceVisibility = 'public' | 'private' | 'unlisted';
export type ServiceLevel = 'L1' | 'L2' | 'L3';

export interface ServiceBase {
  id: string;
  service_name: string;
  service_slug: string;
  category: string;
  subcategory: string | null;
  description_public: string;
  price_usd: number;
  internal_credit_cost: number;
  deliverable_name: string;
  deliverable_type: string;
  estimated_delivery_seconds: number;
  status: ServiceStatus;
  visibility: ServiceVisibility;
  created_at: string;
  updated_at: string;
}

export interface ServiceL3 extends ServiceBase {
  level: 'L3';
  execution_prompt_id: string | null;
  formation_framework_id: string | null;
}

export interface ServiceL2 extends ServiceBase {
  level: 'L2';
  execution_prompt_id: string | null;
  formation_framework_id: string | null;
  component_l3_ids: string[];
  component_selection_logic: Record<string, unknown>;
  component_execution_order: unknown[];
}

export interface ServiceL1 extends ServiceBase {
  level: 'L1';
  execution_prompt_id: string | null;
  formation_framework_id: string | null;
  component_l2_ids: string[];
  component_l3_ids_optional: string[];
  final_delivery_assembly_logic: Record<string, unknown>;
  master_deliverables: unknown[];
  output_types: string[];
}

export type ServiceAny = ServiceL3 | ServiceL2 | ServiceL1;

export interface ServiceCatalog {
  l3: ServiceL3[];
  l2: ServiceL2[];
  l1: ServiceL1[];
}
