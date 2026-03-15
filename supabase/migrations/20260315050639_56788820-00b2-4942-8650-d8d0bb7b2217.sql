
-- Webhook endpoints table
CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  url text NOT NULL,
  secret text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  events text[] NOT NULL DEFAULT ARRAY['job.completed'],
  is_active boolean NOT NULL DEFAULT true,
  description text NOT NULL DEFAULT '',
  failure_count integer NOT NULL DEFAULT 0,
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Webhook deliveries table
CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  response_status integer,
  response_body text,
  attempt integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_webhook_endpoints_user ON public.webhook_endpoints(user_id);
CREATE INDEX idx_webhook_deliveries_endpoint ON public.webhook_deliveries(endpoint_id);
CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries(status) WHERE status = 'pending';

-- RLS
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own webhook endpoints"
  ON public.webhook_endpoints FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users read own webhook deliveries"
  ON public.webhook_deliveries FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.webhook_endpoints
    WHERE webhook_endpoints.id = webhook_deliveries.endpoint_id
    AND webhook_endpoints.user_id = auth.uid()
  ));

CREATE POLICY "Admins manage all endpoints"
  ON public.webhook_endpoints FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage all deliveries"
  ON public.webhook_deliveries FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Content contributions table
CREATE TABLE public.content_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  contribution_type text NOT NULL DEFAULT 'text',
  tags text[] NOT NULL DEFAULT '{}',
  quality_score numeric(4,2) DEFAULT 0,
  word_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid,
  review_note text,
  neurons_awarded integer NOT NULL DEFAULT 0,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contributions_author ON public.content_contributions(author_id);
CREATE INDEX idx_contributions_status ON public.content_contributions(status);

ALTER TABLE public.content_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contributions"
  ON public.content_contributions FOR ALL
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Admins manage all contributions"
  ON public.content_contributions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Published contributions are public"
  ON public.content_contributions FOR SELECT
  TO public
  USING (status = 'approved');

-- Quality scoring function
CREATE OR REPLACE FUNCTION public.score_contribution(_contribution_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _contrib RECORD;
  _score numeric := 0;
BEGIN
  SELECT * INTO _contrib FROM content_contributions WHERE id = _contribution_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Word count scoring (max 30 pts)
  _score := LEAST(_contrib.word_count / 100.0 * 10, 30);
  
  -- Has tags bonus (10 pts)
  IF array_length(_contrib.tags, 1) > 0 THEN
    _score := _score + 10;
  END IF;
  
  -- Length quality bonus (max 20 pts)
  IF _contrib.word_count > 500 THEN _score := _score + 20;
  ELSIF _contrib.word_count > 200 THEN _score := _score + 10;
  END IF;

  -- Update the contribution
  UPDATE content_contributions 
  SET quality_score = _score, updated_at = now()
  WHERE id = _contribution_id;

  RETURN _score;
END;
$$;

-- Auto-award neurons on approval
CREATE OR REPLACE FUNCTION public.on_contribution_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bonus integer;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Calculate bonus: base 5 + quality bonus
    _bonus := 5 + FLOOR(NEW.quality_score / 10);
    
    -- Award neurons
    PERFORM add_credits(NEW.author_id, _bonus, 'Content contribution bonus: ' || NEW.title);
    
    -- Update awarded count
    NEW.neurons_awarded := _bonus;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_contribution_approved
  BEFORE UPDATE ON public.content_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.on_contribution_approved();
