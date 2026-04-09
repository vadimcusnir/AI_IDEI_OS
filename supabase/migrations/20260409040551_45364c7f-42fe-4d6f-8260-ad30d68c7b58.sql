
-- Service purchases table
CREATE TABLE public.service_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_id UUID NOT NULL,
  service_level TEXT NOT NULL CHECK (service_level IN ('L1', 'L2', 'L3')),
  service_name TEXT NOT NULL,
  price_usd_snapshot NUMERIC(10,2) NOT NULL DEFAULT 0,
  neuroni_cost_snapshot INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'credits' CHECK (payment_method IN ('credits', 'stripe', 'free')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  execution_status TEXT NOT NULL DEFAULT 'queued' CHECK (execution_status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  execution_started_at TIMESTAMPTZ,
  execution_completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON public.service_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own purchases"
  ON public.service_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchases"
  ON public.service_purchases FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_service_purchases_user ON public.service_purchases(user_id);
CREATE INDEX idx_service_purchases_status ON public.service_purchases(execution_status);

-- Service deliverables table
CREATE TABLE public.service_deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES public.service_purchases(id) ON DELETE CASCADE,
  service_id UUID NOT NULL,
  service_level TEXT NOT NULL,
  user_id UUID NOT NULL,
  deliverable_name TEXT NOT NULL DEFAULT 'Untitled',
  deliverable_type TEXT NOT NULL DEFAULT 'document',
  content TEXT,
  file_storage_key TEXT,
  format TEXT NOT NULL DEFAULT 'markdown',
  classification_tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed', 'archived')),
  quality_score NUMERIC(3,2),
  metadata JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deliverables"
  ON public.service_deliverables FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deliverables"
  ON public.service_deliverables FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_service_deliverables_user ON public.service_deliverables(user_id);
CREATE INDEX idx_service_deliverables_purchase ON public.service_deliverables(purchase_id);

-- Timestamp triggers
CREATE TRIGGER update_service_purchases_updated_at
  BEFORE UPDATE ON public.service_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_deliverables_updated_at
  BEFORE UPDATE ON public.service_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
