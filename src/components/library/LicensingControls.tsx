/**
 * LicensingControls — UI for setting asset license type.
 * Shows available license tiers with descriptions.
 */
import { useState } from "react";
import { Shield, Lock, Globe, Store, Tag } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useAssetMonetization,
  type LicenseType,
  LICENSE_LABELS,
  LICENSE_DESCRIPTIONS,
} from "@/hooks/useAssetMonetization";

const LICENSE_OPTIONS: { value: LicenseType; icon: React.ElementType }[] = [
  { value: "private_use_only", icon: Lock },
  { value: "commercial_use", icon: Shield },
  { value: "public_display", icon: Globe },
  { value: "resell_on_marketplace", icon: Store },
  { value: "white_label_allowed", icon: Tag },
];

interface Props {
  assetId: string;
  currentLicense: LicenseType;
  onUpdate?: (license: LicenseType) => void;
  className?: string;
}

export function LicensingControls({ assetId, currentLicense, onUpdate, className }: Props) {
  const [selected, setSelected] = useState<LicenseType>(currentLicense);
  const [saving, setSaving] = useState(false);
  const { updateLicense } = useAssetMonetization();

  const handleSave = async () => {
    if (selected === currentLicense) return;
    setSaving(true);
    const ok = await updateLicense(assetId, selected);
    setSaving(false);
    if (ok) onUpdate?.(selected);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">License & Rights</h3>
      </div>

      <RadioGroup value={selected} onValueChange={(v) => setSelected(v as LicenseType)}>
        <div className="space-y-2">
          {LICENSE_OPTIONS.map(({ value, icon: Icon }) => (
            <Label
              key={value}
              htmlFor={`license-${value}`}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                selected === value
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-border/60 hover:bg-muted/30"
              )}
            >
              <RadioGroupItem value={value} id={`license-${value}`} className="mt-0.5" />
              <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", selected === value ? "text-primary" : "text-muted-foreground")} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{LICENSE_LABELS[value]}</p>
                <p className="text-xs text-muted-foreground">{LICENSE_DESCRIPTIONS[value]}</p>
              </div>
              {value === currentLicense && (
                <Badge variant="secondary" className="text-micro ml-auto shrink-0">Current</Badge>
              )}
            </Label>
          ))}
        </div>
      </RadioGroup>

      {selected !== currentLicense && (
        <Button size="sm" onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving…" : `Update to ${LICENSE_LABELS[selected]}`}
        </Button>
      )}
    </div>
  );
}
