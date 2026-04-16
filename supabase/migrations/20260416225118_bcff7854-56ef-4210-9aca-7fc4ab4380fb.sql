
CREATE TABLE public.advisor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New conversation',
  active_experts TEXT[] NOT NULL DEFAULT ARRAY['cfo']::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.advisor_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage own conversations"
ON public.advisor_conversations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND user_id = auth.uid())
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND user_id = auth.uid());

CREATE TABLE public.advisor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.advisor_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  expert_key TEXT,
  content TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_advisor_messages_conv ON public.advisor_messages(conversation_id, created_at);

ALTER TABLE public.advisor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read messages of own conversations"
ON public.advisor_messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (SELECT 1 FROM public.advisor_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
);

CREATE POLICY "Admins insert messages in own conversations"
ON public.advisor_messages
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (SELECT 1 FROM public.advisor_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
);

CREATE TRIGGER trg_advisor_conv_updated
BEFORE UPDATE ON public.advisor_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
