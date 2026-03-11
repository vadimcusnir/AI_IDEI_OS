
-- ══════════════════════════════════════════════════
-- 1. EXECUTION ORCHESTRATION: Job retry & queue columns
-- ══════════════════════════════════════════════════
ALTER TABLE public.neuron_jobs 
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS dead_letter boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;

-- Index for queue processing
CREATE INDEX IF NOT EXISTS idx_neuron_jobs_queue 
  ON public.neuron_jobs (status, priority DESC, scheduled_at ASC) 
  WHERE status IN ('pending', 'running');

CREATE INDEX IF NOT EXISTS idx_neuron_jobs_dead_letter 
  ON public.neuron_jobs (dead_letter, created_at DESC) 
  WHERE dead_letter = true;

-- ══════════════════════════════════════════════════
-- 2. NOTA2 TOKEN BALANCES
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.token_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric(18,8) NOT NULL DEFAULT 0,
  staked numeric(18,8) NOT NULL DEFAULT 0,
  total_earned numeric(18,8) NOT NULL DEFAULT 0,
  access_tier text NOT NULL DEFAULT 'free',
  tier_expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own token balance" 
  ON public.token_balances FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

-- Token transactions log
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric(18,8) NOT NULL,
  type text NOT NULL DEFAULT 'transfer',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own token transactions" 
  ON public.token_transactions FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════
-- 3. SUBSCRIPTION PLANS
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text DEFAULT '',
  price_usd numeric(10,2) NOT NULL DEFAULT 0,
  neurons_monthly integer NOT NULL DEFAULT 0,
  token_requirement numeric(18,8) NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans readable by all" 
  ON public.subscription_plans FOR SELECT TO public 
  USING (is_active = true);

CREATE POLICY "Admins manage plans" 
  ON public.subscription_plans FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role)) 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ══════════════════════════════════════════════════
-- 4. INTERNAL ANALYTICS EVENTS
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_name text NOT NULL,
  event_params jsonb DEFAULT '{}',
  page_path text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own events" 
  ON public.analytics_events FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins read all events" 
  ON public.analytics_events FOR SELECT TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_analytics_events_name 
  ON public.analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user 
  ON public.analytics_events (user_id, created_at DESC);

-- ══════════════════════════════════════════════════
-- 5. IMF PIPELINE DEFINITIONS
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.imf_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  trigger_event text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.imf_pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage pipelines" 
  ON public.imf_pipelines FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role)) 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read active pipelines" 
  ON public.imf_pipelines FOR SELECT TO authenticated 
  USING (is_active = true);

-- Pipeline execution log
CREATE TABLE IF NOT EXISTS public.imf_pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES public.imf_pipelines(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  trigger_data jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  steps_completed integer NOT NULL DEFAULT 0,
  total_steps integer NOT NULL DEFAULT 0,
  result jsonb DEFAULT '{}',
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.imf_pipeline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own pipeline runs" 
  ON public.imf_pipeline_runs FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all pipeline runs" 
  ON public.imf_pipeline_runs FOR SELECT TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ══════════════════════════════════════════════════
-- 6. NEURON EMBEDDINGS (for semantic search)
-- ══════════════════════════════════════════════════
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.neuron_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  neuron_id bigint NOT NULL REFERENCES public.neurons(id) ON DELETE CASCADE,
  embedding extensions.vector(768),
  content_hash text,
  model text NOT NULL DEFAULT 'text-embedding-004',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(neuron_id, model)
);

ALTER TABLE public.neuron_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Embeddings follow neuron visibility" 
  ON public.neuron_embeddings FOR SELECT TO public 
  USING (EXISTS (
    SELECT 1 FROM neurons n 
    WHERE n.id = neuron_embeddings.neuron_id 
    AND (n.visibility = 'public' OR n.author_id = auth.uid())
  ));

-- Semantic search function
CREATE OR REPLACE FUNCTION public.search_neurons_semantic(
  query_embedding extensions.vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  _user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  neuron_id bigint,
  title text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    ne.neuron_id,
    n.title,
    1 - (ne.embedding <=> query_embedding) as similarity
  FROM neuron_embeddings ne
  JOIN neurons n ON n.id = ne.neuron_id
  WHERE 
    (n.visibility = 'public' OR n.author_id = _user_id)
    AND 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ══════════════════════════════════════════════════
-- 7. JOB RETRY FUNCTION (SECURITY DEFINER)
-- ══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.retry_failed_job(_job_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE neuron_jobs
  SET 
    status = 'pending',
    retry_count = retry_count + 1,
    error_message = NULL,
    scheduled_at = now() + (retry_count * interval '30 seconds')
  WHERE id = _job_id
    AND status = 'failed'
    AND dead_letter = false
    AND retry_count < max_retries;
  
  IF NOT FOUND THEN
    -- Move to dead letter if max retries exceeded
    UPDATE neuron_jobs
    SET dead_letter = true
    WHERE id = _job_id
      AND status = 'failed'
      AND retry_count >= max_retries;
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- ══════════════════════════════════════════════════
-- 8. HANDLE NEW USER TOKEN BALANCE TRIGGER
-- ══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.token_balances (user_id, balance, total_earned, access_tier)
  VALUES (NEW.id, 0, 0, 'free')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_tokens
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_tokens();
