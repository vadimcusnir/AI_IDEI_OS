
-- Phase 3: Tone of Voice Analyzer + Market Research Engine services
INSERT INTO public.service_catalog (service_key, name, description, service_class, category, credits_cost, icon, is_active, access_tier, input_schema, deliverables_schema)
VALUES
  -- Tone of Voice Suite
  ('tone-of-voice-analyzer', 'Tone of Voice Analyzer', 'Comprehensive 8-section tone analysis: linguistic register, emotional signature, rhetorical DNA, vocabulary fingerprint', 'B', 'analysis', 500, 'mic', true, 'free',
   '[{"key":"content","label":"Content to Analyze","type":"textarea","required":true,"placeholder":"Paste transcript, article, or any text to analyze..."}]'::jsonb,
   '[{"key":"report","label":"Tone of Voice Report","format":"markdown"}]'::jsonb),

  ('linguistic-deep-analysis', 'Lingvist la Atom', 'Atomic linguistic analysis: phonetics, morphology, syntax, semantics, pragmatics, discourse, stylistic fingerprint', 'C', 'analysis', 800, 'book-open', true, 'starter',
   '[{"key":"content","label":"Content to Analyze","type":"textarea","required":true,"placeholder":"Paste content for deep linguistic analysis..."}]'::jsonb,
   '[{"key":"report","label":"Linguistic Deep Report","format":"markdown"}]'::jsonb),

  ('writing-style-instructions', 'Writing Style Instructions', 'Generate clear brand voice guidelines for your marketing team: tone dimensions, word lists, sentence templates, platform adaptations', 'A', 'content', 300, 'pen-tool', true, 'free',
   '[{"key":"content","label":"Reference Content","type":"textarea","required":true,"placeholder":"Paste content that represents the desired writing style..."}]'::jsonb,
   '[{"key":"document","label":"Style Guide","format":"markdown"}]'::jsonb),

  ('custom-gpt-prompts', 'Custom GPT Prompts', 'Generate personalized AI prompts that replicate your exact voice and writing style across 8 content types', 'B', 'production', 400, 'cpu', true, 'free',
   '[{"key":"content","label":"Reference Content","type":"textarea","required":true,"placeholder":"Paste content to extract voice patterns from..."}]'::jsonb,
   '[{"key":"prompts","label":"Custom GPT Prompt Library","format":"markdown"}]'::jsonb),

  -- Market Research Engine Suite
  ('market-psychology-engine', 'Market Psychology Engine', '8-section deep market psychology analysis: emotional landscape, decision architecture, tribal mapping, pricing psychology', 'C', 'strategy', 800, 'brain', true, 'starter',
   '[{"key":"content","label":"Market Context","type":"textarea","required":true,"placeholder":"Describe your market, industry, product..."},{"key":"industry","label":"Industry","type":"text","required":true,"placeholder":"e.g. SaaS, E-commerce, Consulting"},{"key":"country","label":"Country/Region","type":"text","required":false,"placeholder":"e.g. Romania, EU, Global"}]'::jsonb,
   '[{"key":"report","label":"Market Psychology Report","format":"markdown"}]'::jsonb),

  ('launch-plan-generator', 'Launch Plan Generator', 'Complete go-to-market launch plan: positioning, messaging, channel strategy, 12-week timeline, metrics', 'B', 'strategy', 600, 'rocket', true, 'free',
   '[{"key":"content","label":"Product/Service Context","type":"textarea","required":true,"placeholder":"Describe what you are launching..."},{"key":"industry","label":"Industry","type":"text","required":true},{"key":"country","label":"Target Market","type":"text","required":false}]'::jsonb,
   '[{"key":"plan","label":"Launch Plan","format":"markdown"}]'::jsonb),

  ('implementation-guide', 'Implementation Guide', 'Transform strategy into actionable step-by-step guide with phases, SOPs, risk register, and success metrics', 'B', 'strategy', 400, 'list-checks', true, 'free',
   '[{"key":"content","label":"Strategy/Plan to Implement","type":"textarea","required":true,"placeholder":"Paste the strategy or plan to transform into an implementation guide..."}]'::jsonb,
   '[{"key":"guide","label":"Implementation Guide","format":"markdown"}]'::jsonb),

  -- Market Research Full Pipeline (orchestrated)
  ('market-research-full', 'Market Research Full Pipeline', 'Complete 8-section orchestrated market research: market sizing, competitive landscape, consumer psychology, pricing, GTM, risk analysis — Class S pipeline', 'S', 'orchestration', 3500, 'layers', true, 'pro',
   '[{"key":"industry","label":"Industry","type":"text","required":true,"placeholder":"e.g. EdTech, FinTech, Health & Wellness"},{"key":"country","label":"Country/Region","type":"text","required":false,"placeholder":"e.g. EU, US, Romania"},{"key":"market_phase","label":"Market Phase","type":"select","required":false,"options":["Emerging","Growth","Mature","Declining"]},{"key":"context","label":"Additional Context","type":"textarea","required":false,"placeholder":"Any specific context, product details, or constraints..."}]'::jsonb,
   '[{"key":"report","label":"Complete Market Research Report","format":"markdown"}]'::jsonb);
