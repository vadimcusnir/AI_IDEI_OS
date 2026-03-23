-- Root2 Service Cost Realignment: 1N = $0.002
-- All credits_cost values are Root2 compliant (digital root = 2)

-- Extraction / Simple (20-47N)
UPDATE public.service_catalog SET credits_cost = 20 WHERE service_key IN ('extract_quotes', 'changelog-writer');
UPDATE public.service_catalog SET credits_cost = 29 WHERE service_key IN ('extract_insights', 'extract_questions', 'internal-newsletter', 'podcast-guest-prep', 'meeting-playbook', 'investor-update', 'social-proof-kit', 'thought-piece', 'launch-retrospective');
UPDATE public.service_catalog SET credits_cost = 38 WHERE service_key IN ('extract_prompts', 'data-storytelling', 'customer-win-story', 'pricing-page', 'linkedin-content-calendar', 'product-hunt-launch', 'tiktok-strategy', 'ai-prompt-library', 'content-audit', 'ab-test-playbook', 'okr-framework', 'sales-battlecard', 'value-proposition-canvas', 'stakeholder-report', 'vendor-rfp', 'workshop-facilitator', 'content-pillar-strategy');
UPDATE public.service_catalog SET credits_cost = 47 WHERE service_key IN ('extract_frameworks', 'swipe-file', 'audience-avatar', 'brand-guidelines', 'user-research-plan', 'email-nurture-sequence', 'competitive-intelligence', 'hiring-playbook', 'retention-analysis', 'customer-health-score', 'partnership-playbook', 'technical-spec', 'employee-handbook', 'training-curriculum', 'ecosystem-map', 'crisis-communication', 'knowledge-base', 'saas-metrics-dashboard', 'affiliate-program', 'api-go-to-market');

-- Medium production (56-74N)
UPDATE public.service_catalog SET credits_cost = 56 WHERE service_key IN ('jtbd-extractor', 'thought-leadership', 'hook-generator', 'podcast-shownotes', 'objection-handler', 'financial-model', 'product-roadmap', 'pitch-deck', 'market-entry');
UPDATE public.service_catalog SET credits_cost = 65 WHERE service_key IN ('brand-voice', 'newsletter-generator', 'social-carousel');
UPDATE public.service_catalog SET credits_cost = 74 WHERE service_key IN ('persuasion-map', 'generate_article');

-- Higher production (83-110N)
UPDATE public.service_catalog SET credits_cost = 83 WHERE service_key IN ('competitor-analysis', 'case-study-builder', 'market_research');
UPDATE public.service_catalog SET credits_cost = 92 WHERE service_key IN ('email-sequence', 'video-script', 'workshop-designer', 'pricing-strategy');
UPDATE public.service_catalog SET credits_cost = 110 WHERE service_key IN ('funnel-architect', 'seo-article', 'lead-magnet');

-- Complex / Pipeline (146-380N)
UPDATE public.service_catalog SET credits_cost = 146 WHERE service_key = 'podcast-intelligence';
UPDATE public.service_catalog SET credits_cost = 155 WHERE service_key = 'generate_course';
UPDATE public.service_catalog SET credits_cost = 173 WHERE service_key = 'generate_funnel';
UPDATE public.service_catalog SET credits_cost = 200 WHERE service_key = 'personality-intelligence';
UPDATE public.service_catalog SET credits_cost = 290 WHERE service_key = 'campaign_builder';
UPDATE public.service_catalog SET credits_cost = 380 WHERE service_key = 'avatar33';