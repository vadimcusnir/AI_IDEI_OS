
-- Add marketplace fields to prompt_templates
ALTER TABLE public.prompt_templates 
  ADD COLUMN IF NOT EXISTS price_neurons integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_marketplace boolean DEFAULT false;

-- Create prompt_template_purchases for marketplace tracking
CREATE TABLE IF NOT EXISTS public.prompt_template_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.prompt_templates(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid NOT NULL,
  price_neurons integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.prompt_template_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own purchases" ON public.prompt_template_purchases
  FOR SELECT TO authenticated USING (buyer_id = auth.uid());

CREATE POLICY "Users can purchase" ON public.prompt_template_purchases
  FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());

-- RLS: anyone can view marketplace templates
CREATE POLICY "Anyone can view marketplace templates" ON public.prompt_templates
  FOR SELECT TO authenticated USING (is_public = true OR author_id = auth.uid());

-- Users can create own templates  
CREATE POLICY "Users create own templates" ON public.prompt_templates
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

-- Users update own templates
CREATE POLICY "Users update own templates" ON public.prompt_templates
  FOR UPDATE TO authenticated USING (author_id = auth.uid());

-- Allow users to update rating on their own history
CREATE POLICY "Users update own history" ON public.prompt_history
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
