
ALTER TABLE public.service_units ADD CONSTRAINT fk_prompt FOREIGN KEY (prompt_id) REFERENCES public.prompt_vault(id);
ALTER TABLE public.service_units ADD CONSTRAINT fk_deliverable FOREIGN KEY (deliverable_id) REFERENCES public.deliverable_contracts(id);
