
-- Future services registry
CREATE TABLE public.future_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  estimated_credits INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'proposed',
  availability_timeframe TEXT,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.future_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view future services"
ON public.future_services FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage future services"
ON public.future_services FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service votes (1 vote per user per service)
CREATE TABLE public.service_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  future_service_id UUID NOT NULL REFERENCES public.future_services(id) ON DELETE CASCADE,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, future_service_id)
);

ALTER TABLE public.service_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own votes"
ON public.service_votes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users cast votes"
ON public.service_votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove own votes"
ON public.service_votes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Auto-update vote_count on future_services
CREATE OR REPLACE FUNCTION public.update_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.future_services SET vote_count = vote_count + 1, updated_at = now()
    WHERE id = NEW.future_service_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.future_services SET vote_count = vote_count - 1, updated_at = now()
    WHERE id = OLD.future_service_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_vote_count
AFTER INSERT OR DELETE ON public.service_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_vote_count();
