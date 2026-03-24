export type ServiceClass = "extraction" | "analysis" | "content" | "strategy" | "production" | "orchestration" | "document";
export type ServiceCategory = "extraction" | "analysis" | "content" | "strategy" | "production" | "orchestration" | "document";
export type AccessTier = "free" | "core" | "pro" | "vip";

export interface SchemaField {
  key: string; label: string; type: "text" | "textarea" | "source" | "select" | "number" | "url";
  required?: boolean; placeholder?: string; description?: string; rows?: number;
  options?: { label: string; value: string }[];
  validation?: { minLength?: number; maxLength?: number; pattern?: string; min?: number; max?: number; };
}

export interface DeliverableField { key: string; label: string; type: "text" | "json" | "file" | "url" | "array"; description?: string; }

export interface OTOService {
  id: string; service_key: string; name: string; description: string; service_class: ServiceClass;
  category: ServiceCategory; credits_cost: number; icon: string; is_active: boolean; access_tier: AccessTier;
  input_schema: SchemaField[]; deliverables_schema: DeliverableField[]; atomic_output: true; output_count: 1;
  version: string; deprecated?: boolean; replacement_key?: string;
}

export interface ServiceRegistry { [serviceKey: string]: OTOService; }
export interface PricingContext { base_cost: number; tier_discounts: Record<AccessTier, number>; volume_discounts?: { threshold: number; discount_pct: number; }[]; }

export const DEFAULT_PRICING_CONTEXT: PricingContext = {
  base_cost: 200, tier_discounts: { free: 0, core: 10, pro: 25, vip: 40 },
  volume_discounts: [{ threshold: 10, discount_pct: 5 }, { threshold: 50, discount_pct: 10 }, { threshold: 100, discount_pct: 15 }],
};

export function validateInputSchema(schema: SchemaField[], inputs: Record<string, unknown>): { valid: boolean; errors: { field: string; message: string }[]; } {
  const errors: { field: string; message: string }[] = [];
  for (const field of schema) {
    const value = inputs[field.key];
    if (field.required && (value === undefined || value === null || value === "")) { errors.push({ field: field.key, message: `${field.label} is required` }); continue; }
    if (typeof value === "string") {
      if (field.validation?.minLength && value.length < field.validation.minLength) errors.push({ field: field.key, message: `${field.label} must be at least ${field.validation.minLength} characters` });
      if (field.validation?.maxLength && value.length > field.validation.maxLength) errors.push({ field: field.key, message: `${field.label} must be at most ${field.validation.maxLength} characters` });
    }
    if (typeof value === "number") {
      if (field.validation?.min !== undefined && value < field.validation.min) errors.push({ field: field.key, message: `${field.label} must be at least ${field.validation.min}` });
      if (field.validation?.max !== undefined && value > field.validation.max) errors.push({ field: field.key, message: `${field.label} must be at most ${field.validation.max}` });
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateServiceAtomicity(service: OTOService): { valid: boolean; issues: string[]; } {
  const issues: string[] = [];
  if (service.atomic_output !== true) issues.push("Service must have atomic_output: true");
  if (service.output_count !== 1) issues.push(`Service must produce exactly 1 output, found ${service.output_count}`);
  if (!service.deliverables_schema || service.deliverables_schema.length === 0) issues.push("Service must define deliverables_schema");
  if (!service.input_schema) issues.push("Service must define input_schema");
  return { valid: issues.length === 0, issues };
}

export function getTierDiscount(tier: AccessTier, context: PricingContext = DEFAULT_PRICING_CONTEXT): number { return context.tier_discounts[tier] ?? 0; }
export function calculateFinalCost(baseCost: number, tier: AccessTier, context: PricingContext = DEFAULT_PRICING_CONTEXT): number { const discount = getTierDiscount(tier, context); return Math.round(baseCost - (baseCost * discount / 100)); }
export function isOTOSService(service: unknown): service is OTOService { if (!service || typeof service !== "object") return false; const s = service as Record<string, unknown>; return typeof s.id === "string" && typeof s.service_key === "string" && typeof s.atomic_output === "boolean" && s.atomic_output === true && Array.isArray(s.input_schema) && Array.isArray(s.deliverables_schema); }
