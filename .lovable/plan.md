

# Security & Infrastructure Hardening

## Status actual

1. **Edge Functions (extract-neurons, chunk-transcript, extract-guests, generate-entities)**: Toate 4 verifică JWT **in-code** deja (creează `userClient` cu token-ul din header și apelează `getUser()`). `verify_jwt=false` în config.toml e OK deoarece validarea se face manual. Niciuna nu acceptă `user_id` din body — extrag `userId` din token.

2. **useAIExtraction.ts**: Deja folosește `session.access_token` în header-ul `Authorization`. Corect implementat.

3. **Extractor.tsx**: Query-ul filtrează doar pe `workspace_id`, **fără `author_id`**. Un admin (sau un user cu RLS permisiv) ar putea vedea episoade ale altor utilizatori din același workspace. Trebuie adăugat `.eq("author_id", user.id)`.

4. **CSP**: `index.html` conține `'unsafe-eval'` în `script-src`. Trebuie eliminat — Vite nu necesită `eval` în producție.

5. **Rate limiting**: `extract-neurons` și `extract-guests` folosesc rate limiting **in-memory** (se pierde la restart). `chunk-transcript` și `generate-entities` folosesc deja DB-backed `rateLimitGuard`. Trebuie migrat și restul la `rateLimitGuard`.

## Plan de implementare

### Pas 1: Adaugă filtru `author_id` în Extractor.tsx
- În `fetchEpisodes()`, adaugă `.eq("author_id", user.id)` la query-ul episodes
- Asigură că `user.id` e disponibil în scope (deja importat din `useAuth`)

### Pas 2: Migrează rate limiting la DB-backed
- **extract-neurons/index.ts**: Înlocuiește `rateLimitMap` + `checkRateLimit()` cu import `rateLimitGuard` din `_shared/rate-limiter.ts`, configurare 10 req/h
- **extract-guests/index.ts**: Același lucru — înlocuiește rate limiting in-memory cu `rateLimitGuard`
- Elimină funcțiile locale `checkRateLimit` și variabilele `rateLimitMap`

### Pas 3: Elimină `unsafe-eval` din CSP
- În `index.html`, elimină `'unsafe-eval'` din directiva `script-src`
- Adaugă `https://ai.gateway.lovable.dev` la `connect-src` (lipsește, necesar pentru AI calls)

### Pas 4: Activare protecție parole compromise
- Folosim tool-ul `cloud--configure_auth` pentru a activa HIBP password check

### Pas 5: Monitorizare RLS (documentare)
- Nu necesită cod — RLS e deja aplicat universal pe toate tabelele
- Adăugăm un comentariu/notă în documentația existentă despre revizia periodică

## Fișiere modificate
- `src/pages/Extractor.tsx` — adaugă `.eq("author_id", user.id)`
- `supabase/functions/extract-neurons/index.ts` — migrare la `rateLimitGuard`
- `supabase/functions/extract-guests/index.ts` — migrare la `rateLimitGuard`
- `index.html` — CSP fără `unsafe-eval`, plus `connect-src` completat

## Impact
- Zero breaking changes — toate funcțiile deja validează JWT in-code
- Rate limiting persistent (supraviețuiește restart-urilor edge functions)
- CSP mai strict reduce suprafața de atac XSS
- Episoadele filtrate corect pe `author_id` previne data leakage

