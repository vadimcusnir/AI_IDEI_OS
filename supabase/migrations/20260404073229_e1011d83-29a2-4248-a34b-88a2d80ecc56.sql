
-- ═══════════════════════════════════════════
-- MEDIA PROFILES EXTENSION TABLES
-- ═══════════════════════════════════════════

-- 1. Profile Signals — bridge between extraction and profiles
CREATE TABLE IF NOT EXISTS public.profile_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES intelligence_profiles(id) ON DELETE CASCADE,
  signal_type text NOT NULL DEFAULT 'trait',
  signal_key text NOT NULL,
  signal_value text,
  source_ref text,
  confidence_score numeric(4,3) DEFAULT 0.5,
  neuron_id bigint REFERENCES neurons(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ps_profile ON profile_signals(profile_id);
CREATE INDEX idx_ps_type ON profile_signals(signal_type);

-- 2. Profile Versions — snapshot history
CREATE TABLE IF NOT EXISTS public.profile_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES intelligence_profiles(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  data_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  change_summary text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pv_profile ON profile_versions(profile_id);
CREATE UNIQUE INDEX idx_pv_unique ON profile_versions(profile_id, version);

-- 3. Profile Scores — quality metrics
CREATE TABLE IF NOT EXISTS public.profile_scores (
  profile_id uuid PRIMARY KEY REFERENCES intelligence_profiles(id) ON DELETE CASCADE,
  data_volume numeric(4,3) DEFAULT 0,
  consistency numeric(4,3) DEFAULT 0,
  prediction_accuracy numeric(4,3) DEFAULT 0,
  validation_score numeric(4,3) DEFAULT 0,
  certainty numeric(4,3) DEFAULT 0,
  overall numeric(4,3) DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Profile Audit Log
CREATE TABLE IF NOT EXISTS public.profile_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES intelligence_profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pal_profile ON profile_audit_log(profile_id);

-- ═══════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════

ALTER TABLE profile_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_audit_log ENABLE ROW LEVEL SECURITY;

-- Profile signals: admins full, owners read via profile
CREATE POLICY "Admins manage profile_signals" ON profile_signals
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Read own profile signals" ON profile_signals
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM intelligence_profiles ip
    WHERE ip.id = profile_signals.profile_id
    AND ip.created_by = auth.uid()
  ));

-- Profile versions: same pattern
CREATE POLICY "Admins manage profile_versions" ON profile_versions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Read own profile versions" ON profile_versions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM intelligence_profiles ip
    WHERE ip.id = profile_versions.profile_id
    AND ip.created_by = auth.uid()
  ));

-- Profile scores: public read for published, admin full
CREATE POLICY "Admins manage profile_scores" ON profile_scores
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Read published profile scores" ON profile_scores
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM intelligence_profiles ip
    WHERE ip.id = profile_scores.profile_id
    AND ip.visibility_status = 'published'
  ));

-- Audit log: admin only
CREATE POLICY "Admins manage profile_audit_log" ON profile_audit_log
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ═══════════════════════════════════════════
-- Add RLS for authenticated users to create their own profiles
-- ═══════════════════════════════════════════
CREATE POLICY "Users create own profiles" ON intelligence_profiles
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users read own profiles" ON intelligence_profiles
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());
