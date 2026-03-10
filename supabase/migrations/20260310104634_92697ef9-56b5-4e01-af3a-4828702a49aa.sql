
CREATE TABLE public.user_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  href text NOT NULL,
  icon text DEFAULT 'link',
  position integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own links" ON public.user_links
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own links" ON public.user_links
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own links" ON public.user_links
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own links" ON public.user_links
  FOR DELETE TO authenticated USING (user_id = auth.uid());
