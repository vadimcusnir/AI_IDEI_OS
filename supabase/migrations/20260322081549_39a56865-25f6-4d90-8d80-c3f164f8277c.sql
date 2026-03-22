
-- P0-1: HNSW index on neuron_embeddings for scalable vector search
CREATE INDEX IF NOT EXISTS idx_neuron_embeddings_hnsw 
ON public.neuron_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- P0-2: Idempotency guard index for Stripe webhooks
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_stripe_idempotency 
ON public.credit_transactions (description) 
WHERE type = 'topup' AND description LIKE 'Stripe:%';
