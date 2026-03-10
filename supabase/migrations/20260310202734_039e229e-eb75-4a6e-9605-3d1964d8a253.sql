-- Performance indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_neuron_versions_neuron_version ON public.neuron_versions (neuron_id, version);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_slug ON public.guest_profiles (slug);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_neuron_jobs_status_author ON public.neuron_jobs (status, author_id);
CREATE INDEX IF NOT EXISTS idx_neurons_author_status ON public.neurons (author_id, status);
CREATE INDEX IF NOT EXISTS idx_artifacts_author_id ON public.artifacts (author_id);
CREATE INDEX IF NOT EXISTS idx_entities_type_published ON public.entities (entity_type, is_published);
CREATE INDEX IF NOT EXISTS idx_entities_slug ON public.entities (slug);