
-- Artifacts table: stores generated deliverables from AI services
CREATE TABLE public.artifacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  artifact_type TEXT NOT NULL DEFAULT 'document',
  format TEXT NOT NULL DEFAULT 'markdown',
  content TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}',
  job_id UUID REFERENCES public.neuron_jobs(id) ON DELETE SET NULL,
  service_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction table: links artifacts to source neurons
CREATE TABLE public.artifact_neurons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artifact_id UUID NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  neuron_id INTEGER NOT NULL REFERENCES public.neurons(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'source',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (artifact_id, neuron_id)
);

-- Indexes
CREATE INDEX idx_artifacts_author ON public.artifacts(author_id);
CREATE INDEX idx_artifacts_type ON public.artifacts(artifact_type);
CREATE INDEX idx_artifacts_status ON public.artifacts(status);
CREATE INDEX idx_artifact_neurons_artifact ON public.artifact_neurons(artifact_id);
CREATE INDEX idx_artifact_neurons_neuron ON public.artifact_neurons(neuron_id);

-- RLS
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifact_neurons ENABLE ROW LEVEL SECURITY;

-- Users can read their own artifacts
CREATE POLICY "Users can read own artifacts"
  ON public.artifacts FOR SELECT TO authenticated
  USING (author_id = auth.uid());

-- Users can insert their own artifacts
CREATE POLICY "Users can insert own artifacts"
  ON public.artifacts FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Users can update their own artifacts
CREATE POLICY "Users can update own artifacts"
  ON public.artifacts FOR UPDATE TO authenticated
  USING (author_id = auth.uid());

-- Users can delete their own artifacts
CREATE POLICY "Users can delete own artifacts"
  ON public.artifacts FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- artifact_neurons: users can manage links for their own artifacts
CREATE POLICY "Users can read own artifact neurons"
  ON public.artifact_neurons FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artifacts WHERE id = artifact_id AND author_id = auth.uid()));

CREATE POLICY "Users can insert own artifact neurons"
  ON public.artifact_neurons FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.artifacts WHERE id = artifact_id AND author_id = auth.uid()));

CREATE POLICY "Users can delete own artifact neurons"
  ON public.artifact_neurons FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.artifacts WHERE id = artifact_id AND author_id = auth.uid()));
