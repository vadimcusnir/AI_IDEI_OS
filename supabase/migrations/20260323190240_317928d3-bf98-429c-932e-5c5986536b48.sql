
-- Service Registry: stores all OTOS (atomic formulas), MMS (multi-module systems), LCSS (long-term systems)
CREATE TABLE public.service_registry (
  id text PRIMARY KEY,
  name text NOT NULL,
  service_level text NOT NULL DEFAULT 'OTOS',
  category text DEFAULT '',
  intent text DEFAULT '',
  description text DEFAULT '',
  neurons_cost_min int DEFAULT 0,
  neurons_cost_max int DEFAULT 0,
  score_tier text DEFAULT 'C',
  complexity text DEFAULT 'L1',
  output_type text DEFAULT '',
  domain text DEFAULT '',
  composition jsonb DEFAULT '[]',
  outputs jsonb DEFAULT '{}',
  transformation jsonb DEFAULT '{}',
  monetization jsonb DEFAULT '{}',
  scoring jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for fast filtering
CREATE INDEX idx_service_registry_level ON public.service_registry(service_level);
CREATE INDEX idx_service_registry_category ON public.service_registry(category);
CREATE INDEX idx_service_registry_intent ON public.service_registry(intent);
CREATE INDEX idx_service_registry_tier ON public.service_registry(score_tier);

-- RLS: public read, admin write
ALTER TABLE public.service_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read services"
  ON public.service_registry FOR SELECT
  TO authenticated, anon
  USING (true);
