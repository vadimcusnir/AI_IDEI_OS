-- =============================================================================
-- AI_IDEI_OS - RLS COMPREHENSIVE SECURITY MIGRATION
-- Descriere: Implementare politici RLS pentru toate tabelele cu date utilizator
-- Prioritate: CRITICAL (SEC_001 din audit)
-- =============================================================================

-- ACTIVARE RLS
ALTER TABLE public.asset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neuron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neurons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neuron_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- POLITICI: knowledge_assets
CREATE POLICY "knowledge_assets_select_own" ON public.knowledge_assets FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY "knowledge_assets_insert_own" ON public.knowledge_assets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "knowledge_assets_update_own" ON public.knowledge_assets FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "knowledge_assets_delete_own" ON public.knowledge_assets FOR DELETE TO authenticated USING (user_id = auth.uid());

-- POLITICI: neurons
CREATE POLICY "neurons_select_own" ON public.neurons FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY "neurons_insert_own" ON public.neurons FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "neurons_update_own" ON public.neurons FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "neurons_delete_own" ON public.neurons FOR DELETE TO authenticated USING (user_id = auth.uid());

-- POLITICI: user_credits
CREATE POLICY "user_credits_select_own" ON public.user_credits FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_credits_update_own" ON public.user_credits FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- POLITICI: notifications
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- POLITICI: forum_threads
CREATE POLICY "forum_threads_select" ON public.forum_threads FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "forum_threads_insert_own" ON public.forum_threads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "forum_threads_update_own" ON public.forum_threads FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- POLITICI: forum_posts
CREATE POLICY "forum_posts_select" ON public.forum_posts FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "forum_posts_insert_own" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "forum_posts_update_own" ON public.forum_posts FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- POLITICI: subscriptions
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "subscriptions_update_own" ON public.subscriptions FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- POLITICI: credit_transactions
CREATE POLICY "credit_transactions_select_own" ON public.credit_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "credit_transactions_insert_own" ON public.credit_transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ADMIN ACCESS (pentru admini)
CREATE POLICY "admin_full_access" ON public.knowledge_assets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access_neurons" ON public.neurons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access_credits" ON public.user_credits FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
