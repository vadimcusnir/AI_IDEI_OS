
-- =============================================================================
-- COMPREHENSIVE RLS POLICIES MIGRATION
-- Activează RLS pe toate tabelele publice și creează policies user-scoped
-- =============================================================================

-- Activare RLS pentru toate tabelele
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rec.table_name);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'RLS already enabled or error on table %: %', rec.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Creare policies pentru coloanele user_id, userId, owner_id
DO $$
DECLARE
    rec RECORD;
    policy_name TEXT;
    col_type TEXT;
BEGIN
    FOR rec IN 
        SELECT c.table_name, c.column_name, c.data_type
        FROM information_schema.columns c
        JOIN information_schema.tables t 
            ON c.table_name = t.table_name 
            AND c.table_schema = t.table_schema
        WHERE c.table_schema = 'public'
        AND c.column_name IN ('user_id', 'userId', 'owner_id')
        AND t.table_type = 'BASE TABLE'
    LOOP
        col_type := rec.data_type;
        
        -- SELECT
        policy_name := rec.table_name || '_select_own';
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, rec.table_name);
        IF col_type = 'uuid' THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%I = auth.uid())', policy_name, rec.table_name, rec.column_name);
        ELSE
            EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%I::text = auth.uid()::text)', policy_name, rec.table_name, rec.column_name);
        END IF;
        
        -- INSERT
        policy_name := rec.table_name || '_insert_own';
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, rec.table_name);
        IF col_type = 'uuid' THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%I = auth.uid())', policy_name, rec.table_name, rec.column_name);
        ELSE
            EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%I::text = auth.uid()::text)', policy_name, rec.table_name, rec.column_name);
        END IF;
        
        -- UPDATE
        policy_name := rec.table_name || '_update_own';
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, rec.table_name);
        IF col_type = 'uuid' THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%I = auth.uid())', policy_name, rec.table_name, rec.column_name);
        ELSE
            EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%I::text = auth.uid()::text)', policy_name, rec.table_name, rec.column_name);
        END IF;
        
        -- DELETE
        policy_name := rec.table_name || '_delete_own';
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, rec.table_name);
        IF col_type = 'uuid' THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%I = auth.uid())', policy_name, rec.table_name, rec.column_name);
        ELSE
            EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%I::text = auth.uid()::text)', policy_name, rec.table_name, rec.column_name);
        END IF;
    END LOOP;
END $$;
