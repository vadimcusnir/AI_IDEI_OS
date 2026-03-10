
-- Changelog entries table
CREATE TABLE public.changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'new_feature',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  example text DEFAULT '',
  user_benefit text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  release_date date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  position integer NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

-- Public can read approved entries
CREATE POLICY "Public can read published changelog"
  ON public.changelog_entries FOR SELECT TO public
  USING (status = 'published');

-- Admins can do everything
CREATE POLICY "Admins manage changelog"
  ON public.changelog_entries FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER changelog_updated_at
  BEFORE UPDATE ON public.changelog_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
