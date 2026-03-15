
-- Sprint 1: Performance indexes for critical query paths

-- Neurons by author, sorted by updated_at (Library, Dashboard)
CREATE INDEX IF NOT EXISTS idx_neurons_author_updated 
  ON public.neurons(author_id, updated_at DESC);

-- Episodes by author, sorted by created_at (Extractor)
CREATE INDEX IF NOT EXISTS idx_episodes_author_created 
  ON public.episodes(author_id, created_at DESC);

-- Entities linked to neurons, filtered by published (Knowledge Graph)
CREATE INDEX IF NOT EXISTS idx_entities_neuron_published 
  ON public.entities(neuron_id) WHERE is_published = true;

-- Credit transactions by user, sorted by date (Credits page)
CREATE INDEX IF NOT EXISTS idx_credit_tx_user_created 
  ON public.credit_transactions(user_id, created_at DESC);

-- Neuron jobs by author, sorted by date (Jobs page)
CREATE INDEX IF NOT EXISTS idx_neuron_jobs_author_created 
  ON public.neuron_jobs(author_id, created_at DESC);

-- Active jobs filter (Pipeline, queue processing)
CREATE INDEX IF NOT EXISTS idx_neuron_jobs_status_active 
  ON public.neuron_jobs(status) WHERE status NOT IN ('completed', 'failed');
