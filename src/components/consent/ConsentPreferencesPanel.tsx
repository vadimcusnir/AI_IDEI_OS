/**
 * ConsentPreferencesPanel — in-profile GDPR preferences with server sync.
 */
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getStoredCategories,
  saveCustomConsent,
  type ConsentCategories,
  CONSENT_VERSION_CURRENT,
} from "@/lib/consent";
import { ShieldCheck, Loader2 } from "lucide-react";

export function ConsentPreferencesPanel() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const [categories, setCategories] = useState<ConsentCategories>(getStoredCategories);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load from DB if logged in
  useEffect(() => {
    if (!user) { setLoaded(true); return; }

    (async () => {
      const { data } = await supabase
        .from("consent_preferences")
        .select("analytics, ads, personalization, data_sharing")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setCategories({
          analytics: data.analytics,
          ads: data.ads,
          personalization: data.personalization,
          data_sharing: data.data_sharing,
        });
      }
      setLoaded(true);
    })();
  }, [user]);

  const toggle = (key: keyof ConsentCategories) => {
    setCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Save locally
    saveCustomConsent(categories);

    // Sync to DB if logged in
    if (user) {
      const { error } = await supabase.from("consent_preferences").upsert(
        {
          user_id: user.id,
          ...categories,
          consent_version: CONSENT_VERSION_CURRENT,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (error) {
        toast.error(t("consent.save_error"));
        setSaving(false);
        return;
      }
    }

    toast.success(t("consent.save_success"));
    setSaving(false);
  };

  const items: { key: keyof ConsentCategories; labelKey: string; descKey: string }[] = [
    { key: "analytics", labelKey: "consent.cat_analytics", descKey: "consent.cat_analytics_desc" },
    { key: "ads", labelKey: "consent.cat_ads", descKey: "consent.cat_ads_desc" },
    { key: "personalization", labelKey: "consent.cat_personalization", descKey: "consent.cat_personalization_desc" },
    { key: "data_sharing", labelKey: "consent.cat_data_sharing", descKey: "consent.cat_data_sharing_desc" },
  ];

  if (!loaded) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{t("consent.preferences_title")}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t("consent.preferences_desc")}
      </p>

      <div className="space-y-3">
        {items.map(({ key, labelKey, descKey }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">{t(labelKey)}</p>
              <p className="text-micro text-muted-foreground">{t(descKey)}</p>
            </div>
            <Switch checked={categories[key]} onCheckedChange={() => toggle(key)} />
          </div>
        ))}
      </div>

      <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 text-xs gap-1.5">
        {saving && <Loader2 className="h-3 w-3 animate-spin" />}
        {t("consent.save")}
      </Button>
    </div>
  );
}
