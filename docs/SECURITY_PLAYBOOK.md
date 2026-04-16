# AI-IDEI — Operational Security Playbook

> Documentație operațională pentru proceduri critice de securitate.
> **Locație:** `docs/SECURITY_PLAYBOOK.md` — versiune 1.0 (2026-04-16)

---

## 1. MFA Enforcement pentru Admini

### Politică
Toți utilizatorii cu rolul `admin` în `user_roles` **TREBUIE** să aibă MFA activ. Login fără MFA este blocat la nivelul edge function `admin-mfa-guard`.

### Activare MFA (utilizator)
1. Profile → Security → Enable Two-Factor Authentication
2. Scan QR cu authenticator app (Google Authenticator / Authy / 1Password)
3. Confirm cu cod 6 cifre
4. Salvare backup codes într-un password manager

### Verificare admin
```sql
-- List admins fără MFA activ
SELECT u.email, ur.granted_at
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN auth.mfa_factors f ON f.user_id = u.id AND f.status = 'verified'
WHERE ur.role = 'admin' AND f.id IS NULL;
```

### Auto-revocare
Cron `revoke_admin_no_mfa` rulează zilnic și trimite reminder la 7 zile, revocă rolul la 14 zile fără MFA.

---

## 2. Break-Glass Procedure

### Când se folosește
- Lockout total (toți admin-ii inaccesibili)
- Compromitere suspectată a contului principal
- Migrare urgentă forțată

### Procedură
1. **Verificare identitate** — minim 2 fondatori prezenți (call video + secret comun)
2. **Notificare** — email la `security@ai-idei.com` + Sentry alert
3. **Acces direct DB** prin Lovable Cloud → Backend → SQL Editor
4. **Acțiuni permise:**
   ```sql
   -- Reset MFA pentru un admin compromis (după verificare)
   DELETE FROM auth.mfa_factors WHERE user_id = '<admin_uuid>';
   
   -- Revoke all sessions
   DELETE FROM auth.sessions WHERE user_id = '<admin_uuid>';
   
   -- Grant emergency admin (timelock 1h)
   INSERT INTO public.admin_permissions (user_id, permission_key, expires_at, granted_by, metadata)
   VALUES ('<emergency_user>', 'break_glass_admin', now() + interval '1 hour', '<other_admin>',
           jsonb_build_object('reason', '<incident_id>', 'verified_by', ARRAY['<founder1>','<founder2>']));
   ```
5. **Logging obligatoriu** în `cusnir_os_ledger`:
   ```sql
   INSERT INTO public.cusnir_os_ledger (event_type, actor_id, severity, payload)
   VALUES ('break_glass_invoked', '<actor>', 'critical',
           jsonb_build_object('reason', '...', 'witnesses', ARRAY['...'], 'actions', ARRAY['...']));
   ```
6. **Post-mortem** în 48h → `docs/incidents/YYYY-MM-DD-break-glass.md`

### Audit
Toate evenimentele `break_glass_invoked` declanșează alertă instant în `admin_alerts` cu severitate `critical`.

---

## 3. Secret Rotation Policy

### Cadență
| Secret | Frecvență | Trigger |
|--------|-----------|---------|
| `STRIPE_SECRET_KEY` | 90 zile | Calendar / suspect leak |
| `STRIPE_WEBHOOK_SECRET` | 90 zile | Modificare endpoint |
| `LOVABLE_API_KEY` | Auto (managed) | Sistemic |
| `OPENAI_API`, `YOUTUBE_API`, `COBALT_API_KEY` | 180 zile | Calendar |
| `GITHUB_TOKEN` | 60 zile | Calendar / leak în repo |
| `PAYPALL_*` | 90 zile | Calendar |
| `SENTRY_DSN` | La nevoie | Doar la migrare proiect |
| Supabase API keys | La nevoie | Tool: `rotate_api_keys` |

### Procedură rotation (manual)
1. Generează nou secret în provider (Stripe/GitHub/etc.)
2. Update în Lovable Cloud → Settings → Secrets
3. Verifică că funcțiile edge folosesc noul secret (testare cu un job real)
4. Revocă vechiul secret în provider
5. Loghează în `compliance_log`:
   ```sql
   INSERT INTO public.compliance_log (actor_id, action_type, target_type, description, severity, metadata)
   VALUES (auth.uid(), 'secret_rotation', 'secret', 'Rotated STRIPE_SECRET_KEY', 'info',
           jsonb_build_object('secret_name', 'STRIPE_SECRET_KEY', 'rotated_at', now()));
   ```

### Compromise Response
Dacă un secret e expus public:
1. **Imediat:** Revocă în provider (nu aștepta migrare)
2. Generează nou secret și actualizează în Lovable Cloud
3. Audit log-uri pentru utilizare neautorizată în ultimele 24h
4. Crează entry în `admin_alerts` cu severitate `critical`
5. Post-mortem în 24h

---

## 4. Cross-Tenant Access Monitoring

### Detectare automată
Funcția `detect_cross_tenant_access(actor, target, resource)` se invocă explicit din edge functions ce accesează resurse cross-user. Crează alert + abuse_event.

### Folosire în edge function
```typescript
// Înainte de a returna date despre un alt user
if (target_user_id !== requesting_user_id) {
  await supabase.rpc("detect_cross_tenant_access", {
    _actor_id: requesting_user_id,
    _target_user_id: target_user_id,
    _resource: "artifacts",
    _action: "read",
  });
}
```

---

## 5. Mass Export Tracking

### Folosire
Înainte de a întoarce rezultate de export (CSV, ZIP, bulk download):
```typescript
const { data } = await supabase.rpc("record_export", {
  _resource_type: "artifacts",
  _resource_count: items.length,
  _export_type: "csv",
  _metadata: { format: "csv", filter: appliedFilters },
});
// data.alerted === true → user a depășit 50 exporturi/oră
```

### Threshold
- **>50 itemi/oră** → alertă `high` în `admin_alerts`
- **>500 itemi/oră** → escalare manual review

---

## 6. JSON-LD Injection Safety (F-009)

### Frontend
Folosește **întotdeauna** `safeJsonLd()` din `src/lib/jsonLdSafe.ts` la generarea `<script type="application/ld+json">`.

### Backend
Pentru orice schema_json salvat în DB, validează cu `validate_jsonld_schema(schema)` înainte de insert/update.

```sql
SELECT public.validate_jsonld_schema('{"@context": "https://schema.org", "name": "Test"}'::jsonb);
-- Returnează { "valid": true, "sanitized": {...} } sau { "valid": false, "error": "..." }
```

---

## 7. Refund LLM Failure (F-005)

### Politică
Orice eroare LLM (HTTP non-2xx) declanșează automat refund prin `refund_llm_failure(user_id, amount, reason, service_key, job_id)`. Refund-ul este atomic și logat în `compliance_log` + `credit_transactions`.

### Verificare refund-uri
```sql
SELECT user_id, amount, description, created_at
FROM public.credit_transactions
WHERE type = 'refund' AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

---

## 8. Incident Response Checklist

| Severitate | Răspuns | Notificare |
|-----------|---------|------------|
| `critical` | <15 min | All founders + Sentry + Email |
| `high` | <1 oră | Security lead + Sentry |
| `medium` | <24 ore | Security lead |
| `low` | <7 zile | Triage săptămânal |

---

**Owner:** Security Lead
**Review cadence:** Trimestrial
**Last updated:** 2026-04-16
