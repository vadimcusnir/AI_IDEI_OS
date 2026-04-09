
ALTER TABLE public.neuron_jobs 
  ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_step TEXT,
  ADD COLUMN IF NOT EXISTS total_steps INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS queue_position INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_remaining_seconds INTEGER;

ALTER TABLE public.user_xp 
  ADD COLUMN IF NOT EXISTS quality_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0;

CREATE INDEX IF NOT EXISTS idx_neuron_jobs_progress ON public.neuron_jobs (author_id, status, progress);
