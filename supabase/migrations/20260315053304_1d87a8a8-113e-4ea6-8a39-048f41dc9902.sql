
-- ═══════════════════════════════════════════════════════════
-- CusnirOS VIP Tier — Progressive 11-month access system
-- ═══════════════════════════════════════════════════════════

-- VIP subscription tracking
CREATE TABLE public.vip_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  started_at timestamptz NOT NULL DEFAULT now(),
  current_month integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  paused_at timestamptz,
  completed_at timestamptz,
  tier_override text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- VIP milestones (unlockable at specific months)
CREATE TABLE public.vip_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  unlock_type text NOT NULL DEFAULT 'feature',
  unlock_key text NOT NULL,
  icon text NOT NULL DEFAULT 'star',
  reward_neurons integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User milestone progress
CREATE TABLE public.vip_milestone_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  milestone_id uuid NOT NULL REFERENCES public.vip_milestones(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  claimed_reward boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_id)
);

-- VIP war rooms (exclusive collaboration spaces)
CREATE TABLE public.vip_war_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  min_month integer NOT NULL DEFAULT 6,
  max_members integer NOT NULL DEFAULT 20,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vip_war_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  war_room_id uuid NOT NULL REFERENCES public.vip_war_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(war_room_id, user_id)
);

-- Indexes
CREATE INDEX idx_vip_subs_user ON public.vip_subscriptions(user_id);
CREATE INDEX idx_vip_milestones_month ON public.vip_milestones(month_number);
CREATE INDEX idx_vip_progress_user ON public.vip_milestone_progress(user_id);
CREATE INDEX idx_vip_wr_members_user ON public.vip_war_room_members(user_id);

-- RLS
ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_milestone_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_war_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_war_room_members ENABLE ROW LEVEL SECURITY;

-- vip_subscriptions: user reads own, admin reads all
CREATE POLICY "Users read own VIP subscription" ON public.vip_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin full access vip_subscriptions" ON public.vip_subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- vip_milestones: all authenticated can read active
CREATE POLICY "Authenticated read active milestones" ON public.vip_milestones FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admin full access vip_milestones" ON public.vip_milestones FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- vip_milestone_progress: user reads/inserts own
CREATE POLICY "Users read own milestone progress" ON public.vip_milestone_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own milestone progress" ON public.vip_milestone_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin full access vip_milestone_progress" ON public.vip_milestone_progress FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- vip_war_rooms: authenticated read active
CREATE POLICY "Authenticated read active war rooms" ON public.vip_war_rooms FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admin full access vip_war_rooms" ON public.vip_war_rooms FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- vip_war_room_members: user reads own, admin all
CREATE POLICY "Users read own war room membership" ON public.vip_war_room_members FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin full access vip_war_room_members" ON public.vip_war_room_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed default milestones for the 11-month journey
INSERT INTO public.vip_milestones (month_number, title, description, unlock_type, unlock_key, icon, reward_neurons, position) VALUES
(1, 'Inițierea', 'Accces la biblioteca de bază CusnirOS și primele framework-uri', 'feature', 'cusnir_library_basic', 'book-open', 100, 1),
(2, 'Fundamentele', 'Deblochează 10 framework-uri avansate de marketing', 'feature', 'cusnir_frameworks_10', 'layers', 200, 2),
(3, 'Psihologia Vânzării', 'Acces la modulul de profiling psihologic al clienților', 'feature', 'cusnir_psychology', 'brain', 300, 3),
(4, 'Copywriting Avansat', 'Formula completă de copywriting CusnirOS', 'feature', 'cusnir_copywriting', 'pen-tool', 400, 4),
(5, 'Funnel Architecture', 'Blueprint-uri complete de funnel-uri de vânzare', 'feature', 'cusnir_funnels', 'git-branch', 500, 5),
(6, 'War Room Access', 'Intrare în War Room-urile exclusive CusnirOS', 'war_room', 'cusnir_war_room', 'shield', 600, 6),
(7, 'Scaling Systems', 'Sisteme de scalare automatizată a campaniilor', 'feature', 'cusnir_scaling', 'trending-up', 700, 7),
(8, 'Media Mastery', 'Strategii avansate de media buying și PR', 'feature', 'cusnir_media', 'tv', 800, 8),
(9, 'Team Building', 'Framework de construire echipe de marketing', 'feature', 'cusnir_teams', 'users', 900, 9),
(10, 'Empire Blueprint', 'Planul complet de construire a unui business de 7 cifre', 'feature', 'cusnir_empire', 'crown', 1000, 10),
(11, 'CusnirOS Complete', 'Acces complet la întregul ecosistem CusnirOS — pe viață', 'feature', 'cusnir_os_full', 'sparkles', 2000, 11);

-- Function to advance VIP month
CREATE OR REPLACE FUNCTION public.advance_vip_month(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _sub RECORD;
  _milestone RECORD;
  _new_month integer;
BEGIN
  SELECT * INTO _sub FROM vip_subscriptions WHERE user_id = _user_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'No active VIP subscription');
  END IF;

  _new_month := LEAST(_sub.current_month + 1, 11);

  UPDATE vip_subscriptions SET
    current_month = _new_month,
    completed_at = CASE WHEN _new_month >= 11 THEN now() ELSE NULL END,
    updated_at = now()
  WHERE user_id = _user_id;

  -- Auto-unlock milestone for the new month
  FOR _milestone IN SELECT * FROM vip_milestones WHERE month_number = _new_month AND is_active = true
  LOOP
    INSERT INTO vip_milestone_progress (user_id, milestone_id)
    VALUES (_user_id, _milestone.id)
    ON CONFLICT DO NOTHING;

    -- Award neurons
    IF _milestone.reward_neurons > 0 THEN
      PERFORM add_credits(_user_id, _milestone.reward_neurons, 'VIP Milestone: ' || _milestone.title);
    END IF;

    -- Notify
    INSERT INTO notifications (user_id, type, title, message, link, meta)
    VALUES (_user_id, 'vip_milestone', '🏆 ' || _milestone.title,
      'Ai deblocat luna ' || _new_month || ' din CusnirOS!', '/vip',
      jsonb_build_object('month', _new_month, 'milestone_id', _milestone.id));
  END LOOP;

  RETURN jsonb_build_object('month', _new_month, 'completed', _new_month >= 11);
END;
$$;

-- Function to check VIP access for a specific feature
CREATE OR REPLACE FUNCTION public.check_vip_access(_user_id uuid, _unlock_key text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vip_milestone_progress p
    JOIN vip_milestones m ON m.id = p.milestone_id
    WHERE p.user_id = _user_id AND m.unlock_key = _unlock_key
  );
END;
$$;
