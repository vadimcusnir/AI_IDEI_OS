
-- Raw change events from all sources (git, UI, service, manual)
CREATE TABLE public.changes_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL DEFAULT 'manual',  -- git | ui | service | manual
    source_id TEXT,                          -- commit hash / snapshot id / log id
    component TEXT,                          -- Extractor, Neurons, Services etc
    file_path TEXT,
    diff_summary TEXT,
    impact_level TEXT NOT NULL DEFAULT 'user', -- user | admin | internal
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.changes_raw ENABLE ROW LEVEL SECURITY;

-- Admins can manage all raw changes
CREATE POLICY "Admins manage raw changes"
ON public.changes_raw FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role can insert (for webhook ingestion)
CREATE POLICY "Service can insert raw changes"
ON public.changes_raw FOR INSERT TO anon
WITH CHECK (true);

-- Index for source filtering
CREATE INDEX idx_changes_raw_source ON public.changes_raw(source);
CREATE INDEX idx_changes_raw_created ON public.changes_raw(created_at DESC);
