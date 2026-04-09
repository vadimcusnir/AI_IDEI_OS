
-- Identity dimensions extracted from user content
CREATE TABLE public.identity_dimensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dimension_key TEXT NOT NULL,
  dimension_label TEXT NOT NULL,
  extraction JSONB NOT NULL DEFAULT '{}',
  confidence NUMERIC(4,3) DEFAULT 0,
  source_neuron_ids INTEGER[] DEFAULT '{}',
  model_version TEXT DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, dimension_key)
);

ALTER TABLE public.identity_dimensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own identity dimensions"
  ON public.identity_dimensions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own identity dimensions"
  ON public.identity_dimensions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own identity dimensions"
  ON public.identity_dimensions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own identity dimensions"
  ON public.identity_dimensions FOR DELETE
  USING (auth.uid() = user_id);

-- Personal OS layers
CREATE TABLE public.personal_os_layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  layer_key TEXT NOT NULL,
  layer_label TEXT NOT NULL,
  layer_data JSONB NOT NULL DEFAULT '{}',
  completeness_pct INTEGER DEFAULT 0,
  gap_details JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, layer_key)
);

ALTER TABLE public.personal_os_layers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own OS layers"
  ON public.personal_os_layers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own OS layers"
  ON public.personal_os_layers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own OS layers"
  ON public.personal_os_layers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own OS layers"
  ON public.personal_os_layers FOR DELETE
  USING (auth.uid() = user_id);

-- Profile gap detections
CREATE TABLE public.profile_gap_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dimension_key TEXT NOT NULL,
  gap_severity TEXT NOT NULL DEFAULT 'moderate',
  suggestion_text TEXT,
  suggested_service_slug TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_gap_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile gaps"
  ON public.profile_gap_detections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts profile gaps"
  ON public.profile_gap_detections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own profile gaps"
  ON public.profile_gap_detections FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_identity_dims_user ON public.identity_dimensions(user_id);
CREATE INDEX idx_os_layers_user ON public.personal_os_layers(user_id);
CREATE INDEX idx_profile_gaps_user ON public.profile_gap_detections(user_id);
CREATE INDEX idx_profile_gaps_unresolved ON public.profile_gap_detections(user_id, resolved) WHERE NOT resolved;
