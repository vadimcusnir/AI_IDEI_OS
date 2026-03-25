
-- P2-014: Database Query Optimization — Additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_service_run_history_user_status ON public.service_run_history(user_id, status);
CREATE INDEX IF NOT EXISTS idx_service_run_history_service_key ON public.service_run_history(service_key);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_role ON public.chat_messages(session_id, role);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status, created_at);
CREATE INDEX IF NOT EXISTS idx_neuron_jobs_status_priority ON public.neuron_jobs(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON public.credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_executions_user_status ON public.service_executions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created ON public.analytics_events(user_id, created_at DESC);
