-- Performance indexes for Faza 0.2.1
CREATE INDEX IF NOT EXISTS idx_neurons_author_id ON public.neurons(author_id);
CREATE INDEX IF NOT EXISTS idx_entities_slug ON public.entities(slug);
CREATE INDEX IF NOT EXISTS idx_neuron_blocks_neuron_id ON public.neuron_blocks(neuron_id);
CREATE INDEX IF NOT EXISTS idx_episodes_author_id ON public.episodes(author_id);
CREATE INDEX IF NOT EXISTS idx_neuron_jobs_author_id ON public.neuron_jobs(author_id);
CREATE INDEX IF NOT EXISTS idx_neuron_jobs_status ON public.neuron_jobs(status);
CREATE INDEX IF NOT EXISTS idx_artifacts_author_id ON public.artifacts(author_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_author_id ON public.guest_profiles(author_id);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_slug ON public.guest_profiles(slug);