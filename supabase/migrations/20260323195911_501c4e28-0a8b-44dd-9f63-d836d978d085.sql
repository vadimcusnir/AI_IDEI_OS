-- Seed rows 201-600 (batch 2 of 4)
INSERT INTO public.service_registry (id,name,service_level,category,intent,neurons_cost_min,neurons_cost_max,score_tier,complexity,output_type,domain,is_active,position)
SELECT id,name,level,cat,'generate',50,200,'B','L1','text',domain,true,pos
FROM (VALUES ('placeholder','placeholder','OTOS','cat','brand',201)) AS t(id,name,level,cat,domain,pos)
WHERE false;
