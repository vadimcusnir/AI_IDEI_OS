
-- Add columns for variants, chaining, and rating to prompt_history
ALTER TABLE public.prompt_history
  ADD COLUMN IF NOT EXISTS rating smallint CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS feedback text,
  ADD COLUMN IF NOT EXISTS variant_index smallint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chain_parent_id uuid REFERENCES public.prompt_history(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chain_step smallint DEFAULT 0;

-- Index for chain lookups
CREATE INDEX IF NOT EXISTS idx_prompt_history_chain ON public.prompt_history(chain_parent_id) WHERE chain_parent_id IS NOT NULL;
