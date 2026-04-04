import { useTranslation } from "react-i18next";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calculator, CheckCircle2, XCircle, Coins } from "lucide-react";

/**
 * Root2 Pricing Engine — Admin tab
 * Validates that digital sum of price equals 2.
 * Provides tools for price generation and validation.
 */

function digitRoot(n: number): number {
  n = Math.abs(Math.floor(n));
  if (n === 0) return 0;
  let sum = n;
  while (sum > 9) {
    let temp = 0;
    while (sum > 0) {
      temp += sum % 10;
      sum = Math.floor(sum / 10);
    }
    sum = temp;
  }
  return sum;
}

function isRoot2(price: number): boolean {
  return digitRoot(price) === 2;
}

function nearestRoot2(target: number): number[] {
  const results: number[] = [];
  for (let i = Math.max(2, target - 50); i <= target + 50; i++) {
    if (isRoot2(i)) results.push(i);
  }
  return results;
}

const ROOT2_PACKAGES = [
  { neurons: 1000, price: 2 },
  { neurons: 5500, price: 11 },
  { neurons: 10000, price: 20 },
  { neurons: 18500, price: 37, label: "Pro" },
  { neurons: 23500, price: 47 },
  { neurons: 37000, price: 74 },
  { neurons: 46000, price: 92 },
  { neurons: 68500, price: 137, label: "VIP" },
  { neurons: 100000, price: 200 },
  { neurons: 145000, price: 290 },
];

export function Root2PricingTab() {
  const [testPrice, setTestPrice] = useState("");
  const { t } = useTranslation();
  const [testResult, setTestResult] = useState<{ valid: boolean; root: number; suggestions: number[] } | null>(null);
  const [root2Enabled, setRoot2Enabled] = useState(true);

  const handleTest = () => {
    const n = Number(testPrice);
    if (!n || n <= 0) { toast.error(t("toast_invalid_price")); return; }
    const root = digitRoot(n);
    const valid = root === 2;
    const suggestions = valid ? [] : nearestRoot2(n).slice(0, 8);
    setTestResult({ valid, root, suggestions });
  };

  const handleToggle = async (enabled: boolean) => {
    setRoot2Enabled(enabled);
    // Save to feature_flags
    const { error } = await supabase
      .from("feature_flags")
      .upsert({ key: "root2_pricing", enabled, description: "Root2 pricing validation", rollout_percentage: 100 }, { onConflict: "key" });
    if (error) toast.error(t("toast_save_error"));
    else toast.success(enabled ? "Root2 activat" : "Root2 dezactivat");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Root2 Pricing Engine
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Validare prețuri — suma cifrelor trebuie să fie 2. Ex: 11 (1+1=2), 47 (4+7=11→1+1=2), 9992 (9+9+9+2=29→2+9=11→1+1=2).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label>Root2 Pricing Activ</Label>
              <p className="text-xs text-muted-foreground">Aplică validare Root2 pe toate prețurile vizibile</p>
            </div>
            <Switch checked={root2Enabled} onCheckedChange={handleToggle} />
          </div>

          {/* Price tester */}
          <div className="space-y-3">
            <Label>Testează un preț</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Ex: 47"
                value={testPrice}
                onChange={(e) => setTestPrice(e.target.value)}
                className="max-w-[200px]"
              />
              <Button onClick={handleTest} variant="outline">Verifică</Button>
            </div>
            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${testResult.valid ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                {testResult.valid ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-medium">✓ Root2 valid — rădăcina digitală = {testResult.root}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    <div>
                      <span className="text-sm font-medium">✗ Invalid — rădăcina digitală = {testResult.root}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {testResult.suggestions.map((s) => (
                          <Badge key={s} variant="outline" className="cursor-pointer text-xs" onClick={() => { setTestPrice(String(s)); setTestResult(null); }}>
                            ${s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Predefined packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="h-4 w-4" />
            Pachete Root2 Standard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {ROOT2_PACKAGES.map((pkg) => (
              <div key={pkg.price} className="flex flex-col items-center p-3 rounded-lg border border-border/50 bg-muted/30">
                <span className="text-lg font-bold">${pkg.price}</span>
                <span className="text-xs text-muted-foreground">{pkg.neurons.toLocaleString()} NEURONS</span>
                <Badge variant="outline" className="mt-1 text-micro">
                  root={digitRoot(pkg.price)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
