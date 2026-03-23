-- ROOT2 FULL NORMALIZATION: Fix all non-Root2 service prices
-- Root2 rule: digital root of price must equal 2
-- Valid scale: 20,29,38,47,56,65,74,83,92,110,146,155,173,200,290,380,470,560,830,1460,3800

UPDATE public.service_catalog SET credits_cost = 29 WHERE service_key = 'prompt-forge' AND credits_cost = 25;
UPDATE public.service_catalog SET credits_cost = 29 WHERE service_key = 'faq-generator' AND credits_cost = 30;
UPDATE public.service_catalog SET credits_cost = 47 WHERE credits_cost = 50;
UPDATE public.service_catalog SET credits_cost = 56 WHERE credits_cost = 55;
UPDATE public.service_catalog SET credits_cost = 56 WHERE credits_cost = 60;
UPDATE public.service_catalog SET credits_cost = 74 WHERE credits_cost = 70;
UPDATE public.service_catalog SET credits_cost = 74 WHERE credits_cost = 75;
UPDATE public.service_catalog SET credits_cost = 83 WHERE credits_cost = 80;
UPDATE public.service_catalog SET credits_cost = 290 WHERE credits_cost = 300;
UPDATE public.service_catalog SET credits_cost = 380 WHERE credits_cost = 350;
UPDATE public.service_catalog SET credits_cost = 380 WHERE credits_cost = 400;
UPDATE public.service_catalog SET credits_cost = 470 WHERE credits_cost = 450;
UPDATE public.service_catalog SET credits_cost = 470 WHERE credits_cost = 500;
UPDATE public.service_catalog SET credits_cost = 560 WHERE credits_cost = 600;
UPDATE public.service_catalog SET credits_cost = 830 WHERE credits_cost = 800;
UPDATE public.service_catalog SET credits_cost = 1460 WHERE credits_cost = 1500;
UPDATE public.service_catalog SET credits_cost = 3800 WHERE credits_cost = 3500;