/**
 * useAssetMonetization — Manages asset licensing, commercialization checks,
 * and anti-conflict scoring for marketplace publishing.
 */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type LicenseType =
  | "private_use_only"
  | "commercial_use"
  | "public_display"
  | "resell_on_marketplace"
  | "white_label_allowed";

export type CommercializationStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "restricted"
  | "blocked";

export type ConflictLevel = "no_conflict" | "moderate_overlap" | "high_overlap" | "forbidden_substitution";

export interface CommercializationResult {
  conflictLevel: ConflictLevel;
  conflictScore: number;
  overlappingServices: { name: string; level: string; overlapPct: number }[];
  canPublish: boolean;
  restrictions: string[];
}

export const LICENSE_LABELS: Record<LicenseType, string> = {
  private_use_only: "Private Use Only",
  commercial_use: "Commercial Use",
  public_display: "Public Display",
  resell_on_marketplace: "Resell on Marketplace",
  white_label_allowed: "White Label Allowed",
};

export const LICENSE_DESCRIPTIONS: Record<LicenseType, string> = {
  private_use_only: "Only visible in your private workspace",
  commercial_use: "Can be used commercially but not resold",
  public_display: "Visible on your public profile",
  resell_on_marketplace: "Listed for sale in the Marketplace",
  white_label_allowed: "Buyers can rebrand and redistribute",
};

export function useAssetMonetization() {
  const { user } = useAuth();
  const [checking, setChecking] = useState(false);

  const updateLicense = useCallback(async (assetId: string, licenseType: LicenseType) => {
    if (!user) return false;

    const { error } = await supabase
      .from("knowledge_assets")
      .update({ license_type: licenseType } as any)
      .eq("id", assetId)
      .eq("author_id", user.id);

    if (error) {
      toast.error("Failed to update license");
      return false;
    }
    toast.success(`License updated to ${LICENSE_LABELS[licenseType]}`);
    return true;
  }, [user]);

  const runCommercializationCheck = useCallback(async (
    assetId: string,
    assetTitle: string,
    assetTags: string[]
  ): Promise<CommercializationResult> => {
    setChecking(true);
    try {
      // Fetch platform services to check for overlap
      const [l3Res, l2Res] = await Promise.all([
        supabase.from("services_level_3").select("service_name, category, deliverable_type").eq("status", "active"),
        supabase.from("services_level_2").select("service_name, category, deliverable_type").eq("status", "active"),
      ]);

      const services = [
        ...(l3Res.data || []).map(s => ({ ...s, level: "L3" })),
        ...(l2Res.data || []).map(s => ({ ...s, level: "L2" })),
      ];

      // Simple keyword-based overlap detection
      const titleWords = assetTitle.toLowerCase().split(/\s+/);
      const tagSet = new Set(assetTags.map(t => t.toLowerCase()));

      const overlapping: CommercializationResult["overlappingServices"] = [];

      for (const svc of services) {
        const svcWords = svc.service_name.toLowerCase().split(/\s+/);
        const commonWords = svcWords.filter(w => titleWords.includes(w) || tagSet.has(w));
        const overlapPct = svcWords.length > 0 ? Math.round((commonWords.length / svcWords.length) * 100) : 0;

        if (overlapPct >= 30) {
          overlapping.push({
            name: svc.service_name,
            level: svc.level,
            overlapPct,
          });
        }
      }

      const maxOverlap = overlapping.length > 0 ? Math.max(...overlapping.map(o => o.overlapPct)) : 0;
      const conflictScore = Math.min(maxOverlap, 100);

      let conflictLevel: ConflictLevel = "no_conflict";
      const restrictions: string[] = [];

      if (conflictScore >= 80) {
        conflictLevel = "forbidden_substitution";
        restrictions.push("This asset directly substitutes a premium platform service");
        restrictions.push("Publishing is blocked to protect service integrity");
      } else if (conflictScore >= 60) {
        conflictLevel = "high_overlap";
        restrictions.push("Significant overlap with platform services detected");
        restrictions.push("Publishing allowed with pricing restrictions");
      } else if (conflictScore >= 30) {
        conflictLevel = "moderate_overlap";
        restrictions.push("Some overlap detected — publishing allowed with upsell links");
      }

      const canPublish = conflictLevel !== "forbidden_substitution";
      const status: CommercializationStatus = canPublish
        ? conflictLevel === "no_conflict" ? "approved" : "restricted"
        : "blocked";

      // Save conflict results
      await supabase
        .from("knowledge_assets")
        .update({
          conflict_score: conflictScore,
          conflict_details: { overlapping, conflictLevel, restrictions },
          commercialization_status: status,
        } as any)
        .eq("id", assetId);

      return { conflictLevel, conflictScore, overlappingServices: overlapping, canPublish, restrictions };
    } finally {
      setChecking(false);
    }
  }, []);

  return { updateLicense, runCommercializationCheck, checking };
}
