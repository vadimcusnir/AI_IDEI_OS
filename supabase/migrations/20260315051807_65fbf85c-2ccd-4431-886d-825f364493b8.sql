
-- ══════════════════════════════════════════════════
-- Wallet State & Access Window SSOT Tables
-- ══════════════════════════════════════════════════

-- 1. wallet_state — tracks three balance types with snapshot freshness
CREATE TABLE IF NOT EXISTS public.wallet_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available DECIMAL(20,8) NOT NULL DEFAULT 0,
  staked DECIMAL(20,8) NOT NULL DEFAULT 0,
  locked DECIMAL(20,8) NOT NULL DEFAULT 0,
  snapshot_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  chain_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Computed index for snapshot age queries
CREATE INDEX IF NOT EXISTS idx_wallet_snapshot_age 
  ON public.wallet_state (snapshot_ts);

-- 2. access_window_state — entitlement gating with policy versioning
CREATE TABLE IF NOT EXISTS public.access_window_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_status TEXT NOT NULL DEFAULT 'open' CHECK (window_status IN ('open', 'restricted', 'locked', 'suspended')),
  entitlement_lock BOOLEAN NOT NULL DEFAULT false,
  policy_version TEXT NOT NULL DEFAULT '1.0.0',
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'business', 'vip')),
  last_verified_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. RLS policies
ALTER TABLE public.wallet_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_window_state ENABLE ROW LEVEL SECURITY;

-- wallet_state: user can read own, admin can read all
CREATE POLICY "Users read own wallet" ON public.wallet_state
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users update own wallet" ON public.wallet_state
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System inserts wallet" ON public.wallet_state
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- access_window_state: user can read own, admin can read/write all
CREATE POLICY "Users read own access" ON public.access_window_state
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin manages access" ON public.access_window_state
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System inserts access" ON public.access_window_state
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. Trigger to auto-create wallet on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.wallet_state (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.access_window_state (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. Snapshot freshness check function
CREATE OR REPLACE FUNCTION public.check_wallet_freshness(_user_id uuid, _max_age_seconds integer DEFAULT 60)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _wallet RECORD;
  _age_seconds FLOAT;
BEGIN
  SELECT * INTO _wallet FROM wallet_state WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('fresh', false, 'reason', 'WALLET_NOT_FOUND', 'age_seconds', null);
  END IF;

  _age_seconds := EXTRACT(EPOCH FROM (now() - _wallet.snapshot_ts));
  
  IF _age_seconds > _max_age_seconds THEN
    RETURN jsonb_build_object(
      'fresh', false,
      'reason', 'WALLET_SNAPSHOT_STALE',
      'age_seconds', _age_seconds,
      'threshold', _max_age_seconds,
      'available', _wallet.available,
      'staked', _wallet.staked,
      'locked', _wallet.locked
    );
  END IF;

  RETURN jsonb_build_object(
    'fresh', true,
    'age_seconds', _age_seconds,
    'available', _wallet.available,
    'staked', _wallet.staked,
    'locked', _wallet.locked,
    'tier', (SELECT tier FROM access_window_state WHERE user_id = _user_id)
  );
END;
$$;
