
-- Guest profiles extracted from transcripts
CREATE TABLE public.guest_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  full_name text NOT NULL,
  slug text NOT NULL,
  role text NOT NULL DEFAULT 'guest',
  bio text DEFAULT '',
  expertise_areas text[] DEFAULT '{}',
  frameworks_mentioned text[] DEFAULT '{}',
  psychological_traits text[] DEFAULT '{}',
  key_quotes text[] DEFAULT '{}',
  episode_ids uuid[] DEFAULT '{}',
  neuron_ids bigint[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  is_public boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(author_id, slug)
);

ALTER TABLE public.guest_profiles ENABLE ROW LEVEL SECURITY;

-- Owner can CRUD
CREATE POLICY "Users can manage own guest profiles"
  ON public.guest_profiles FOR ALL
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Public can read public profiles
CREATE POLICY "Public can read public guest profiles"
  ON public.guest_profiles FOR SELECT
  TO public
  USING (is_public = true);
