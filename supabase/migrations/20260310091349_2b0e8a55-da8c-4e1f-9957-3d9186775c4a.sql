
-- User credit balances
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 500,
  total_earned integer NOT NULL DEFAULT 500,
  total_spent integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own credits" ON public.user_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own credits" ON public.user_credits
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own credits" ON public.user_credits
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Credit transactions ledger
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid REFERENCES public.neuron_jobs(id),
  amount integer NOT NULL,
  type text NOT NULL DEFAULT 'spend',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions" ON public.credit_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions" ON public.credit_transactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Enable realtime for jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.neuron_jobs;
