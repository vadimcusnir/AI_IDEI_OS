
-- Chat sessions table for multiple conversations per notebook
CREATE TABLE public.notebook_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add session_id to messages
ALTER TABLE public.notebook_messages ADD COLUMN session_id UUID REFERENCES public.notebook_chat_sessions(id) ON DELETE CASCADE;

-- Add summary column to sources for AI auto-summary
ALTER TABLE public.notebook_sources ADD COLUMN summary TEXT;

-- RLS
ALTER TABLE public.notebook_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their notebook sessions"
ON public.notebook_chat_sessions
FOR ALL
TO authenticated
USING (
  notebook_id IN (SELECT id FROM public.notebooks WHERE owner_id = auth.uid())
)
WITH CHECK (
  notebook_id IN (SELECT id FROM public.notebooks WHERE owner_id = auth.uid())
);

-- Index
CREATE INDEX idx_chat_sessions_notebook ON public.notebook_chat_sessions(notebook_id);
CREATE INDEX idx_notebook_messages_session ON public.notebook_messages(session_id);
