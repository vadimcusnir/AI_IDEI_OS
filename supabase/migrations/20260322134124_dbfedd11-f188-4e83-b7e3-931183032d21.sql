
-- Prompt templates library
CREATE TABLE public.prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  goal text NOT NULL,
  context_template text NOT NULL DEFAULT '',
  details_template text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  icon text NOT NULL DEFAULT 'Wand2',
  is_system boolean NOT NULL DEFAULT false,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  use_count integer NOT NULL DEFAULT 0,
  avg_rating numeric DEFAULT 0,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Prompt history (user's past generations)
CREATE TABLE public.prompt_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.prompt_templates(id) ON DELETE SET NULL,
  goal text NOT NULL,
  context text NOT NULL,
  details text DEFAULT '',
  result text NOT NULL DEFAULT '',
  credits_spent integer NOT NULL DEFAULT 0,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;

-- Templates: public ones readable by all authenticated, own templates manageable
CREATE POLICY "Anyone can read public templates" ON public.prompt_templates
  FOR SELECT TO authenticated USING (is_public = true OR author_id = auth.uid());

CREATE POLICY "Users manage own templates" ON public.prompt_templates
  FOR ALL TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY "Admins manage all templates" ON public.prompt_templates
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- History: users see only their own
CREATE POLICY "Users manage own history" ON public.prompt_history
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_prompt_templates_goal ON public.prompt_templates(goal);
CREATE INDEX idx_prompt_templates_category ON public.prompt_templates(category);
CREATE INDEX idx_prompt_history_user ON public.prompt_history(user_id, created_at DESC);

-- Seed system templates
INSERT INTO public.prompt_templates (title, description, goal, context_template, details_template, category, is_system, icon) VALUES
('Extragere Experiență', 'Transformă experiența profesională într-un profil structurat cu skills, milestone-uri și realizări cheie.', 'Extragere experiență', 'Descrie experiența ta profesională, rolurile avute și realizările principale.', 'Specifică industria, anii de experiență și competențele cheie.', 'branding', true, 'User'),
('Descriere Profil', 'Generează o descriere de profil profesional optimizată pentru LinkedIn, website sau CV.', 'Descriere profil', 'Descrie background-ul tău, expertiza și ce te diferențiază.', 'Ton dorit (formal/casual), platforma țintă, lungime preferată.', 'branding', true, 'FileText'),
('Product Recommendation', 'Analizează nevoile și generează recomandări de produse/servicii personalizate.', 'Product Recommendation', 'Descrie publicul țintă, nevoile lor și bugetul disponibil.', 'Industria, preferințe, criterii de selecție.', 'marketing', true, 'ShoppingBag'),
('Content Structuring', 'Structurează conținut brut în format organizat cu headings, secțiuni și flow logic.', 'Content Structuring', 'Lipește conținutul brut care trebuie structurat.', 'Formatul dorit (articol, curs, ghid), publicul țintă.', 'content', true, 'LayoutList'),
('Sales Copy', 'Generează copy persuasiv de vânzare cu hooks, beneficii și CTA-uri puternice.', 'Sales Copy', 'Descrie produsul/serviciul, prețul și publicul țintă.', 'Tonul brandului, USP, obiecții frecvente.', 'marketing', true, 'PenTool'),
('Email Sequence', 'Creează o secvență de email-uri automatizate pentru nurturing, onboarding sau vânzare.', 'Email Sequence', 'Descrie obiectivul secvenței, audiența și produsul/serviciul promovat.', 'Număr de email-uri, frecvență, tonul comunicării.', 'marketing', true, 'Mail'),
('Landing Page Copy', 'Generează copy complet pentru o landing page cu hero, beneficii, testimoniale și CTA.', 'Landing Page Copy', 'Descrie produsul, oferta și publicul țintă.', 'Stil vizual, ton, elemente obligatorii.', 'marketing', true, 'Wand2'),
('Social Media Calendar', 'Planifică un calendar de conținut pentru social media pe 30 de zile.', 'Social Media Calendar', 'Descrie brandul, platformele active și obiectivele de marketing.', 'Frecvența postărilor, teme recurente, formaturi preferate.', 'content', true, 'LayoutList');
