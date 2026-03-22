
-- ═══════════════════════════════════════════════
-- PHASE 3: Integration Layer — Knowledge Ingestion Hub
-- ═══════════════════════════════════════════════

-- 3.1 Connector Architecture
CREATE TABLE public.integration_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  display_name text NOT NULL,
  icon text NOT NULL DEFAULT 'plug',
  description text NOT NULL DEFAULT '',
  auth_type text NOT NULL DEFAULT 'oauth2' CHECK (auth_type IN ('oauth2', 'api_key', 'webhook', 'none')),
  sync_mode text NOT NULL DEFAULT 'manual' CHECK (sync_mode IN ('manual', 'scheduled', 'realtime')),
  rate_limit_per_hour integer NOT NULL DEFAULT 100,
  config_schema jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id uuid NOT NULL REFERENCES public.integration_connectors(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error', 'syncing')),
  auth_tokens jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  sync_interval_hours integer NOT NULL DEFAULT 6,
  last_sync_at timestamptz,
  next_sync_at timestamptz,
  documents_imported integer NOT NULL DEFAULT 0,
  neurons_generated integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, connector_id)
);

CREATE TABLE public.source_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  integration_id uuid REFERENCES public.user_integrations(id) ON DELETE SET NULL,
  external_id text,
  external_url text,
  title text NOT NULL DEFAULT 'Untitled',
  content_type text NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'audio', 'video', 'url', 'pdf', 'html')),
  content_hash text,
  raw_content text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'duplicate')),
  episode_id uuid REFERENCES public.episodes(id) ON DELETE SET NULL,
  neurons_extracted integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sync history log
CREATE TABLE public.sync_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.user_integrations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  documents_found integer NOT NULL DEFAULT 0,
  documents_new integer NOT NULL DEFAULT 0,
  documents_updated integer NOT NULL DEFAULT 0,
  documents_skipped integer NOT NULL DEFAULT 0,
  neurons_generated integer NOT NULL DEFAULT 0,
  error_log jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer
);

-- Incoming webhook registrations
CREATE TABLE public.incoming_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'My Webhook',
  webhook_key text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  is_active boolean NOT NULL DEFAULT true,
  accepted_content_types text[] NOT NULL DEFAULT ARRAY['text', 'url', 'html'],
  auto_extract boolean NOT NULL DEFAULT true,
  target_workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  calls_count integer NOT NULL DEFAULT 0,
  last_called_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_integrations_user ON public.user_integrations(user_id);
CREATE INDEX idx_user_integrations_status ON public.user_integrations(status);
CREATE INDEX idx_source_documents_user ON public.source_documents(user_id);
CREATE INDEX idx_source_documents_hash ON public.source_documents(content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX idx_source_documents_status ON public.source_documents(status);
CREATE INDEX idx_source_documents_integration ON public.source_documents(integration_id);
CREATE INDEX idx_sync_history_integration ON public.sync_history(integration_id);
CREATE INDEX idx_incoming_webhooks_key ON public.incoming_webhooks(webhook_key);

-- RLS
ALTER TABLE public.integration_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_webhooks ENABLE ROW LEVEL SECURITY;

-- Connectors: readable by all authenticated
CREATE POLICY "Anyone can read connectors" ON public.integration_connectors FOR SELECT TO authenticated USING (true);

-- User integrations: own data only
CREATE POLICY "Users manage own integrations" ON public.user_integrations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Source documents: own data only
CREATE POLICY "Users manage own documents" ON public.source_documents FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Sync history: own data only
CREATE POLICY "Users view own sync history" ON public.sync_history FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Incoming webhooks: own data only
CREATE POLICY "Users manage own webhooks" ON public.incoming_webhooks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Auto-update timestamps
CREATE TRIGGER trg_user_integrations_updated BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_source_documents_updated BEFORE UPDATE ON public.source_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Content hash function for deduplication
CREATE OR REPLACE FUNCTION public.compute_content_hash(_content text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT encode(sha256(convert_to(regexp_replace(lower(trim(_content)), '\s+', ' ', 'g'), 'UTF8')), 'hex')
$$;

-- Auto-compute content hash on source_documents insert/update
CREATE OR REPLACE FUNCTION public.auto_content_hash()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.raw_content IS NOT NULL AND (NEW.content_hash IS NULL OR OLD.raw_content IS DISTINCT FROM NEW.raw_content) THEN
    NEW.content_hash := compute_content_hash(NEW.raw_content);
    -- Check for duplicates
    IF EXISTS (
      SELECT 1 FROM source_documents
      WHERE content_hash = NEW.content_hash
        AND user_id = NEW.user_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      NEW.status := 'duplicate';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_content_hash BEFORE INSERT OR UPDATE ON public.source_documents
  FOR EACH ROW EXECUTE FUNCTION auto_content_hash();
