
-- Seed L3 services
INSERT INTO public.services_level_3 (service_name, service_slug, category, subcategory, description_public, price_usd, internal_credit_cost, production_cost_usd, deliverable_name, deliverable_type, estimated_delivery_seconds) VALUES
  ('Titlu 4U', 'titlu-4u', 'copywriting', 'headlines', 'Generează un titlu optimizat cu formula 4U: Useful, Urgent, Ultra-specific, Unique.', 9.00, 3, 0.15, 'Titlu Optimizat 4U', 'text', 30),
  ('Articol SEO', 'articol-seo', 'content', 'articles', 'Articol complet optimizat SEO, cu structură H1-H4, meta description și keyword targeting.', 39.00, 12, 0.80, 'Articol SEO Complet', 'document', 120),
  ('Email de Vânzare', 'email-vanzare', 'copywriting', 'email', 'Email de vânzare cu hook, story, offer și CTA optimizat pentru conversie.', 14.00, 5, 0.25, 'Email Copy', 'text', 45),
  ('Script Video', 'script-video', 'content', 'video', 'Script video structurat: hook, problemă, soluție, CTA. Optimizat pentru retenție.', 19.00, 7, 0.35, 'Script Video', 'document', 90),
  ('Landing Page Copy', 'landing-page-copy', 'copywriting', 'landing', 'Copy complet pentru landing page: headline, subheadline, beneficii, testimoniale, CTA.', 29.00, 10, 0.50, 'Landing Page Copy', 'document', 120),
  ('Social Media Post', 'social-media-post', 'content', 'social', 'Post optimizat pentru engagement pe social media cu hook și CTA.', 5.00, 2, 0.08, 'Social Post', 'text', 20);

-- Seed L2 services
INSERT INTO public.services_level_2 (service_name, service_slug, category, subcategory, description_public, price_usd, internal_credit_cost, production_cost_usd, deliverable_name, deliverable_type, estimated_delivery_seconds) VALUES
  ('Pre-Webinar Email Sequence', 'pre-webinar-email-sequence', 'automation', 'email-sequences', 'Secvență completă de 5 emailuri pre-webinar: invitație, reminder, urgență, last call, replay.', 79.00, 25, 1.50, 'Email Sequence Bundle', 'bundle', 300),
  ('Telegram Event Posts', 'telegram-event-posts', 'content', 'social-sequences', 'Pachet de 10 posturi Telegram pentru promovarea unui eveniment: teaser, countdown, live, recap.', 69.00, 20, 1.20, 'Telegram Posts Pack', 'bundle', 240),
  ('Content Marketing Pack', 'content-marketing-pack', 'content', 'marketing', 'Pachet complet: 1 articol SEO + 5 social posts + 2 emailuri de promovare.', 149.00, 45, 3.00, 'Content Pack', 'bundle', 600);

-- Seed L1 services
INSERT INTO public.services_level_1 (service_name, service_slug, category, subcategory, description_public, price_usd, internal_credit_cost, production_cost_usd, deliverable_name, deliverable_type, estimated_delivery_seconds, output_types) VALUES
  ('Webinar Cap-Coadă', 'webinar-cap-coada', 'systems', 'webinar', 'Sistem complet de webinar: landing page, email sequence, script prezentare, follow-up, replay page.', 399.00, 120, 8.00, 'Webinar System', 'system', 1800, ARRAY['document','text','landing_page']),
  ('Curs Online Complet', 'curs-online-complet', 'systems', 'education', 'Sistem complet de curs: 12 module, landing page, email onboarding, certificat, sales page.', 990.00, 300, 20.00, 'Course System', 'system', 3600, ARRAY['document','curriculum','landing_page','email_sequence']),
  ('Market Research System', 'market-research-system', 'systems', 'research', 'Sistem complet de cercetare: analiză competiție, buyer persona, opportunity map, positioning strategy.', 590.00, 180, 12.00, 'Research System', 'system', 2400, ARRAY['document','report','data_analysis']);
