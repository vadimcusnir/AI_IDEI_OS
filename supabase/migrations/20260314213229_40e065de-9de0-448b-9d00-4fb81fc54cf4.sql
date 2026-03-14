
-- Chat message history persistence
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id text NOT NULL DEFAULT gen_random_uuid()::text,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own chat messages" ON public.chat_messages
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_chat_messages_user_session ON public.chat_messages(user_id, session_id, created_at);

-- Knowledge assets / marketplace
CREATE TABLE public.knowledge_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  asset_type text NOT NULL DEFAULT 'template',
  price_usd numeric DEFAULT 0,
  price_neurons integer DEFAULT 0,
  neuron_ids bigint[] DEFAULT '{}',
  artifact_ids uuid[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  preview_content text DEFAULT '',
  is_published boolean DEFAULT false,
  sales_count integer DEFAULT 0,
  rating_avg numeric DEFAULT 0,
  rating_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors manage own assets" ON public.knowledge_assets
  FOR ALL TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "Public can read published assets" ON public.knowledge_assets
  FOR SELECT TO public USING (is_published = true);

-- Asset transactions
CREATE TABLE public.asset_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES public.knowledge_assets(id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  amount_neurons integer NOT NULL DEFAULT 0,
  amount_usd numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions" ON public.asset_transactions
  FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- User achievements / gamification
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_key text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'trophy',
  xp_reward integer DEFAULT 0,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Public can read achievements" ON public.user_achievements
  FOR SELECT TO public USING (true);

-- Access simulation log for admins
CREATE TABLE public.access_simulation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  simulated_user_id uuid,
  service_key text NOT NULL,
  verdict jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_simulation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage simulation logs" ON public.access_simulation_log
  FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role)) 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Achievement trigger function
CREATE OR REPLACE FUNCTION public.check_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _neuron_count integer;
  _job_count integer;
BEGIN
  -- Count neurons
  SELECT COUNT(*) INTO _neuron_count FROM neurons WHERE author_id = NEW.author_id;
  
  -- First neuron
  IF _neuron_count = 1 THEN
    INSERT INTO user_achievements (user_id, achievement_key, title, description, icon, xp_reward)
    VALUES (NEW.author_id, 'first_neuron', 'Primul Neuron', 'Ai creat primul tău neuron de cunoștințe', 'brain', 50)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- 10 neurons
  IF _neuron_count = 10 THEN
    INSERT INTO user_achievements (user_id, achievement_key, title, description, icon, xp_reward)
    VALUES (NEW.author_id, 'ten_neurons', 'Colecționar', 'Ai acumulat 10 neuroni', 'layers', 100)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- 50 neurons
  IF _neuron_count = 50 THEN
    INSERT INTO user_achievements (user_id, achievement_key, title, description, icon, xp_reward)
    VALUES (NEW.author_id, 'fifty_neurons', 'Knowledge Builder', '50 de neuroni în bibliotecă', 'sparkles', 250)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_achievements
  AFTER INSERT ON neurons
  FOR EACH ROW
  EXECUTE FUNCTION check_achievements();

-- Job completion achievements
CREATE OR REPLACE FUNCTION public.check_job_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _completed_count integer;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    SELECT COUNT(*) INTO _completed_count FROM neuron_jobs WHERE author_id = NEW.author_id AND status = 'completed';
    
    IF _completed_count = 1 THEN
      INSERT INTO user_achievements (user_id, achievement_key, title, description, icon, xp_reward)
      VALUES (NEW.author_id, 'first_service', 'Prima Execuție', 'Ai rulat primul serviciu AI', 'zap', 50)
      ON CONFLICT DO NOTHING;
    END IF;
    
    IF _completed_count = 10 THEN
      INSERT INTO user_achievements (user_id, achievement_key, title, description, icon, xp_reward)
      VALUES (NEW.author_id, 'ten_services', 'Power User', '10 servicii AI finalizate', 'rocket', 150)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_check_job_achievements
  AFTER UPDATE ON neuron_jobs
  FOR EACH ROW
  EXECUTE FUNCTION check_job_achievements();
