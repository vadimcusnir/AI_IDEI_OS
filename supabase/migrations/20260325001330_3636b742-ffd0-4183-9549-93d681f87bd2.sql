
-- PART 2: Policies for tables that exist - using safe DO blocks

DO $$
DECLARE
  tbl TEXT;
  col TEXT;
  ops TEXT[];
  op TEXT;
BEGIN
  -- Define table->column mappings for user_id tables
  FOR tbl, col IN VALUES
    ('profiles', 'user_id'),
    ('notifications', 'user_id'),
    ('api_keys', 'user_id'),
    ('subscriptions', 'user_id'),
    ('payments', 'user_id'),
    ('wallets', 'user_id'),
    ('audit_logs', 'user_id'),
    ('activity_log', 'user_id'),
    ('conversations', 'user_id'),
    ('messages', 'user_id'),
    ('chat_sessions', 'user_id'),
    ('chat_conversations', 'user_id'),
    ('chat_messages', 'user_id'),
    ('feedback', 'user_id'),
    ('episodes', 'author_id'),
    ('artifacts', 'author_id'),
    ('credit_transactions', 'user_id'),
    ('challenge_progress', 'user_id'),
    ('neuron_transactions', 'user_id'),
    ('neuron_wallets', 'user_id'),
    ('neuron_balances', 'user_id'),
    ('wallet_state', 'user_id'),
    ('wallet_transactions', 'user_id'),
    ('usage_logs', 'user_id'),
    ('usage_events', 'user_id'),
    ('user_preferences', 'user_id'),
    ('user_profiles', 'user_id'),
    ('user_roles', 'user_id'),
    ('user_stats', 'user_id'),
    ('user_levels', 'user_id'),
    ('user_badges', 'user_id'),
    ('user_neurons', 'user_id'),
    ('user_subscriptions', 'user_id'),
    ('user_payments', 'user_id'),
    ('user_entitlements', 'user_id'),
    ('xp_events', 'user_id'),
    ('analytics_events', 'user_id'),
    ('stripe_customers', 'user_id'),
    ('stripe_subscriptions', 'user_id'),
    ('stripe_payments', 'user_id'),
    ('todos', 'user_id'),
    ('runs', 'user_id'),
    ('jobs', 'user_id'),
    ('exports', 'user_id'),
    ('saved_articles', 'user_id'),
    ('saved_searches', 'user_id'),
    ('saved_views', 'user_id'),
    ('reading_history', 'user_id'),
    ('reviews', 'user_id'),
    ('recommendations', 'user_id'),
    ('insights', 'user_id'),
    ('error_reports', 'user_id'),
    ('integrations', 'user_id')
  LOOP
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      -- Check if column exists
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tbl AND column_name=col) THEN
        ops := ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
        FOREACH op IN ARRAY ops LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_' || lower(op) || '_own', tbl);
          IF op = 'INSERT' THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO authenticated WITH CHECK (%I = auth.uid())', tbl || '_' || lower(op) || '_own', tbl, op, col);
          ELSE
            EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO authenticated USING (%I = auth.uid())', tbl || '_' || lower(op) || '_own', tbl, op, col);
          END IF;
        END LOOP;
      END IF;
    END IF;
  END LOOP;
END $$;

-- owner_id tables
DO $$
DECLARE
  tbl TEXT;
  ops TEXT[];
  op TEXT;
BEGIN
  FOR tbl IN VALUES
    ('collaboration_sessions'),
    ('memory_items'),
    ('neurons'),
    ('orgs'),
    ('shared_analytics'),
    ('teams'),
    ('war_rooms'),
    ('workspaces')
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tbl AND column_name='owner_id') THEN
        ops := ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
        FOREACH op IN ARRAY ops LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_' || lower(op) || '_own', tbl);
          IF op = 'INSERT' THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO authenticated WITH CHECK (owner_id = auth.uid())', tbl || '_' || lower(op) || '_own', tbl, op);
          ELSE
            EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO authenticated USING (owner_id = auth.uid())', tbl || '_' || lower(op) || '_own', tbl, op);
          END IF;
        END LOOP;
      END IF;
    END IF;
  END LOOP;
END $$;

-- camelCase userId tables
DO $$
DECLARE
  tbl TEXT;
  ops TEXT[];
  op TEXT;
BEGIN
  FOR tbl IN VALUES
    ('credits'),
    ('credit_ledger'),
    ('generation_costs')
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tbl AND column_name='userId') THEN
        ops := ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
        FOREACH op IN ARRAY ops LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_' || lower(op) || '_own', tbl);
          IF op = 'INSERT' THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO authenticated WITH CHECK ("userId" = auth.uid())', tbl || '_' || lower(op) || '_own', tbl, op);
          ELSE
            EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO authenticated USING ("userId" = auth.uid())', tbl || '_' || lower(op) || '_own', tbl, op);
          END IF;
        END LOOP;
      END IF;
    END IF;
  END LOOP;
END $$;
