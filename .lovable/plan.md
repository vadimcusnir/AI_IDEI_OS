

# Bug Fix: Workspace Switcher afișează toate workspace-urile tuturor utilizatorilor

## Cauza root

Utilizatorul curent are rolul **admin**. Politica RLS `admin_full_access_workspaces` (ALL policy) permite adminilor să vadă **toate** workspace-urile din baza de date (19 în total). Aceasta e corectă pentru paginile de admin, dar incorectă pentru WorkspaceSwitcher — acolo utilizatorul ar trebui să vadă doar workspace-urile proprii sau cele unde este membru.

## Fix

**Fișier**: `src/contexts/WorkspaceContext.tsx`

Modificarea query-ului de încărcare a workspace-urilor din:
```sql
SELECT * FROM workspaces ORDER BY created_at
```
în:
```sql
SELECT * FROM workspaces
WHERE owner_id = user.id
   OR id IN (SELECT workspace_id FROM workspace_members WHERE user_id = user.id)
ORDER BY created_at
```

Concret, se adaugă un filtru explicit `.or(\`owner_id.eq.${user.id},id.in.(select workspace_id from workspace_members where user_id='${user.id}')\`)` pe query-ul Supabase, astfel încât indiferent de RLS admin, doar workspace-urile relevante apar în switcher.

**Alternativă mai simplă**: se filtrează client-side — după fetch, se păstrează doar workspace-urile unde `owner_id === user.id` sau unde userul apare în `workspace_members`. Dar filtrul server-side e preferabil pentru a nu descărca date inutile.

## Impact
- WorkspaceSwitcher va afișa doar 1-2 workspace-uri (cele ale utilizatorului)
- Zero impact pe paginile admin (care au query-uri separate)
- Nu necesită modificări de RLS

