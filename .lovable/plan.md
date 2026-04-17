
User asks "ce recomanzi?" — I should give a clear recommendation, not more questions.

Context:
- Two example YAMLs shown: `PROMPT_DATABASE_SYSTEM` (relational meta-schema for organizing prompts) and `cusnir_music_identity` (rich identity-contract narrative).
- Current generator produces standard execution YAML (chain-of-thought + execution_steps + output_schema + security_rules) for 3,494 services. 4 done, ~3,490 to go.
- The two examples serve DIFFERENT purposes than execution specs:
  - PROMPT_DATABASE_SYSTEM = how to ORGANIZE prompts (meta — registry schema)
  - cusnir_music_identity = artistic IDENTITY profile (one-off, not per-service)
- Forcing all 3,490 services into identity-contract style = wrong fit. Most services are functional (extract, analyze, generate), not identity profiles.

My recommendation: **HYBRID — keep current execution schema, add lightweight DB-registry metadata layer**. Don't regenerate the 4. Don't bloat each YAML with identity-contract narrative.

# Recomandare

**Continuă cu schema actuală + adaugă strat de metadata relațional. NU regenera.**

## De ce

| Schemă | Scop | Potrivire pe 3,490 servicii |
|---|---|---|
| Actuală (chain-of-thought + execution_steps + output_schema + security_rules) | Execuție AI programatică | ✅ Perfect — servicii funcționale |
| PROMPT_DATABASE_SYSTEM | Meta — cum organizezi registrul | ❌ E schema bazei, nu a prompt-ului |
| Identity-contract (Cusnir Music) | Profil narativ artist/brand | ❌ Doar pentru ~10 servicii de identitate |

Forțarea a 3,490 servicii (extract transcript, generate SEO, analyze tone…) într-un format de "identitate artistică" = bloat fără valoare execuțională.

## Ce fac concret

1. **Păstrez schema actuală** pentru cele 3,490 rămase — e deja optimă pentru execuție AI.
2. **Adaug header standardizat** la fiecare YAML (din PROMPT_DATABASE_SYSTEM):
   ```
   id: PRM-XXXX
   classification: { domain, function, input_type, output_type }
   cluster: <semantic_cluster>
   version: 1.0
   status: active
   scoring: { utility_score, revenue_score, total_score }
   ```
3. **Tabel nou `prompt_db_registry`** cu coloanele: `prompt_id` (PRM-####), `service_key`, `domain`, `function`, `input_type`, `output_type`, `cluster_id`, `utility_score`, `revenue_score`. Auto-completat la generare.
4. **Cele 4 deja generate** → migrate metadata only (script, fără AI cost). Nu regenerez.
5. **Identity-contract template** = opțional, doar pentru ~10-15 servicii de profilare/branding (avatar, brand voice, artist identity). Buton separat în Admin "Generate as Identity Profile".

## Beneficii

- **Cost zero suplimentar** pentru cele 4 generate.
- **Schemă unitară** (toate au id PRM-####, classification, scoring).
- **Search & cluster** rapid în Admin (filter by domain/function).
- **Fail-closed** — fiecare prompt are id + classification = anti-haos.
- **Identity-contract** rămâne disponibil pentru cazuri reale, nu forțat.

## Implementare (în default mode)

1. Migrare DB: tabel `prompt_db_registry` + indecși.
2. Update `batch-generate-prompts/index.ts`: generează PRM id, extrage classification din service metadata, scrie în `prompt_db_registry`.
3. Update system prompt: adaugă header relațional la output YAML.
4. Script one-time: backfill cele 4 cu metadata.
5. Admin UI: filtre by domain/function/cluster + scoring view.
6. Resume batch — continuă de la serviciul 5.

**Estimare**: ~30 min implementare, jobul continuă fără pauză.
