
-- Performance indexes (Launch Checklist)

-- neuron_versions
CREATE INDEX IF NOT EXISTS idx_neuron_versions_neuron_id ON neuron_versions (neuron_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_neuron_versions_author ON neuron_versions (author_id, created_at DESC);

-- guest_profiles
CREATE INDEX IF NOT EXISTS idx_guest_profiles_slug ON guest_profiles (slug);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_author ON guest_profiles (author_id);

-- credit_transactions
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_date ON credit_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_job ON credit_transactions (job_id) WHERE job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions (user_id, type);

-- neuron_jobs
CREATE INDEX IF NOT EXISTS idx_neuron_jobs_status_scheduled ON neuron_jobs (status, scheduled_at) WHERE status IN ('pending', 'running');
CREATE INDEX IF NOT EXISTS idx_neuron_jobs_author_status ON neuron_jobs (author_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_neuron_jobs_neuron ON neuron_jobs (neuron_id);
CREATE INDEX IF NOT EXISTS idx_neuron_jobs_dead_letter ON neuron_jobs (dead_letter, status) WHERE dead_letter = true;

-- neurons
CREATE INDEX IF NOT EXISTS idx_neurons_author_updated ON neurons (author_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_neurons_workspace ON neurons (workspace_id, updated_at DESC) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_neurons_visibility ON neurons (visibility) WHERE visibility = 'public';

-- artifacts
CREATE INDEX IF NOT EXISTS idx_artifacts_author_date ON artifacts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_job ON artifacts (job_id) WHERE job_id IS NOT NULL;

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, read, created_at DESC);

-- forum
CREATE INDEX IF NOT EXISTS idx_forum_threads_category_activity ON forum_threads (category_id, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON forum_posts (thread_id, created_at);
