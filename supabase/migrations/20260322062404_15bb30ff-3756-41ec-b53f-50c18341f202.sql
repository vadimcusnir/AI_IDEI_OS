
-- Guest profile duplicate suggestions
CREATE TABLE IF NOT EXISTS public.guest_profile_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_profile_id uuid NOT NULL,
  target_profile_id uuid NOT NULL,
  suggested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  similarity_score numeric DEFAULT 0,
  status text DEFAULT 'pending',
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_profile_id, target_profile_id)
);

ALTER TABLE public.guest_profile_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view suggestions" ON public.guest_profile_suggestions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can create suggestions" ON public.guest_profile_suggestions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = suggested_by);

CREATE POLICY "Admins can update suggestions" ON public.guest_profile_suggestions
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Guest profile collaborative edits
CREATE TABLE IF NOT EXISTS public.guest_profile_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_profile_id uuid NOT NULL,
  editor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text NOT NULL,
  status text DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.guest_profile_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view edits" ON public.guest_profile_edits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can create edits" ON public.guest_profile_edits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = editor_id);

CREATE POLICY "Admins can update edits" ON public.guest_profile_edits
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
