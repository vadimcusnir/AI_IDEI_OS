# PRM-0210 — Dev Backlog: Command Center UX Rebuild

**Process:** PROC-0202 — command_center_ux_standard
**Output:** Epics, stories, tasks cu criterii de acceptanță, estimări în puncte

---

## EPIC 1 — Language & Microcopy Fix
**Prioritate:** P0 — Critică (bug de produs)
**Estimare:** 2 zile

### Story 1.1 — Unify interface language to English
**Criterii de acceptanță:**
- [ ] `placeholder="Execută comandă..."` → `placeholder="Run a command..."`
- [ ] Hint text `Enter trimite · / comenzi · + servicii` → `Enter to run · / for commands · + to attach`
- [ ] Zero elemente în română în interfața Command Center
- [ ] Audit complet al tuturor string-urilor din componenta `/home`

### Story 1.2 — Fix hardcoded placeholder values
**Criterii de acceptanță:**
- [ ] `It's been 999 days` → calculat dinamic din `last_session_date`
- [ ] `· 1 msgs` → `· 1 message` / `· {N} messages` (pluralizare corectă)
- [ ] `Knowledge Completeness: 0%` → valoare reală din API

### Story 1.3 — Add missing error messages
**Criterii de acceptanță:**
- [ ] Eroare credite insuficiente: `Not enough neurons. This command requires ~{N}N. Top up →`
- [ ] Eroare timeout: `Command timed out. Try again or simplify your request.`
- [ ] Eroare comandă invalidă: `Unknown command. Type / to see available commands.`
- [ ] Eroare upload: `File upload failed. Max size: 50MB. Supported: PDF, TXT, DOCX.`

---

## EPIC 2 — Empty State Redesign
**Prioritate:** P0 — Critică
**Estimare:** 3 zile

### Story 2.1 — Restructure empty state into two zones
**Criterii de acceptanță:**
- [ ] Zona A (acțiune imediată): welcome message + suggestions, `min-height: 40vh`, centrat vertical
- [ ] Zona B (context/istoric): recent sessions + recommended actions, scroll normal
- [ ] Separator vizibil între zone A și B
- [ ] Zona A dispare când sesiune activă

### Story 2.2 — Dynamic suggestion cards
**Criterii de acceptanță:**
- [ ] Sugestiile sunt generate pe baza contextului real al utilizatorului (neuroni, pipeline, sesiuni)
- [ ] Fallback pentru utilizatori noi: `Upload a document to extract your first neurons.`
- [ ] Click pe card injectează comanda în textarea și focusează inputul
- [ ] Maxim 4 sugestii afișate simultan

### Story 2.3 — Limit recent sessions in empty state
**Criterii de acceptanță:**
- [ ] Maxim 5 sesiuni vizibile implicit (nu 30)
- [ ] `Show {N} more sessions` pentru restul
- [ ] Grupare temporală: Today / Yesterday / This week / Older
- [ ] Sesiunile au timestamp compact (`2h ago`, `Yesterday`, `Apr 15`)

### Story 2.4 — Fix Knowledge Completeness widget
**Criterii de acceptanță:**
- [ ] Titlu: `Knowledge Map`
- [ ] Scor dinamic din API
- [ ] Sub-text: `{N} neurons · {X} gaps detected`
- [ ] CTA: `Fill gaps →` cu link la acțiunea relevantă

---

## EPIC 3 — Input System Enhancement
**Prioritate:** P1 — Înaltă
**Estimare:** 4 zile

### Story 3.1 — Mode pills with active state
**Criterii de acceptanță:**
- [ ] Pill activ are stil distinct: `bg-primary/15, text-primary, border-primary/40`
- [ ] Un singur mod activ la un moment dat
- [ ] Modul activ este persistent în sesiune (nu se resetează la fiecare mesaj)
- [ ] Modul poate fi pre-selectat via URL param `?mode=extract`

### Story 3.2 — Command palette (`/` trigger)
**Criterii de acceptanță:**
- [ ] Se deschide când utilizatorul tastează `/` în textarea
- [ ] Filtrare în timp real
- [ ] Navigare cu `↑↓`, selectare cu `Enter`, închidere cu `Escape`
- [ ] Afișează cost estimat per comandă
- [ ] Categorii: Extract / Analyze / Generate / System

### Story 3.3 — Service picker (`+` trigger)
**Criterii de acceptanță:**
- [ ] Se deschide la click pe `+`
- [ ] Opțiuni: Upload file (drag & drop) + servicii disponibile
- [ ] Fișier atașat afișat ca chip în textarea
- [ ] Maxim 3 atașamente simultan

### Story 3.4 — Cost estimator
**Criterii de acceptanță:**
- [ ] Cost estimat afișat în hint row dreapta: `~{N} neurons`
- [ ] Se actualizează dinamic pe baza lungimii comenzii și modului selectat
- [ ] Roșu dacă costul estimat depășește creditul disponibil

---

## EPIC 4 — Context Panel (State / Runs / Assets)
**Prioritate:** P1 — Înaltă
**Estimare:** 5 zile

### Story 4.1 — Add labels to context panel tabs
**Criterii de acceptanță:**
- [ ] Fiecare tab are icon + label text
- [ ] Tab Runs: badge cu numărul de runs active
- [ ] Tab Assets: badge cu numărul de assets noi
- [ ] Tooltip pe hover cu descriere scurtă

### Story 4.2 — Auto-open panel on active runs
**Criterii de acceptanță:**
- [ ] Panoul se deschide automat când există runs active
- [ ] Panoul se deschide automat când sunt generate assets noi
- [ ] Utilizatorul poate închide manual și preferința este salvată în sesiune

### Story 4.3 — State tab content
**Criterii de acceptanță:**
- [ ] Afișează: Mode, Model, Context messages count, Neurons used, Session ID
- [ ] Empty state: `No active state. Start a session to see variables.`

### Story 4.4 — Runs tab content
**Criterii de acceptanță:**
- [ ] Fiecare run: status indicator + command preview + durată + cost
- [ ] Status: running (dot animat) / complete (checkmark) / failed (X + Retry)
- [ ] Empty state: `No runs yet. Commands will appear here when processing.`

### Story 4.5 — Assets tab content
**Criterii de acceptanță:**
- [ ] Fiecare asset: tip fișier + nume + dimensiune + timestamp + Download
- [ ] Preview pentru fișiere text/markdown
- [ ] Empty state: `No assets generated. Run a Generate command to create files.`

---

## EPIC 5 — Navigation Restructure
**Prioritate:** P1 — Înaltă
**Estimare:** 3 zile

### Story 5.1 — Reduce primary nav to 5 items
**Criterii de acceptanță:**
- [ ] Primary nav: Command Center, Pipeline, Library, Services, Neurons
- [ ] Secondary nav (colapsibil): Jobs, Credits, Marketplace, Purchases, Knowledge Graph, Analytics
- [ ] ADMIN nav: vizibil DOAR în OPERATOR MODE
- [ ] Stare colapsată/expandată salvată în localStorage

### Story 5.2 — Add notification badges to nav items
**Criterii de acceptanță:**
- [ ] Jobs: badge cu numărul de task-uri noi
- [ ] Credits: indicator roșu dacă credite sub pragul minim
- [ ] Marketplace: badge pentru oferte noi (opțional)

### Story 5.3 — Mobile bottom nav fix
**Criterii de acceptanță:**
- [ ] 4 itemi: Command Center, Pipeline, Library, More
- [ ] `More` deschide un drawer cu restul itemilor
- [ ] Elimină redundanța cu sidebar-ul colapsibil
- [ ] Touch target minim 44×44px

---

## EPIC 6 — Session Management
**Prioritate:** P2 — Medie
**Estimare:** 4 zile

### Story 6.1 — Session search
**Criterii de acceptanță:**
- [ ] Search bar în lista de sesiuni (când > 10 sesiuni)
- [ ] Filtrare în timp real pe titlu
- [ ] Filtrare pe mod (Extract / Analyze / Generate)

### Story 6.2 — Session actions
**Criterii de acceptanță:**
- [ ] Rename sesiune (click pe titlu sau context menu)
- [ ] Delete sesiune (cu confirmare)
- [ ] Pin sesiune (apare în top)
- [ ] Export sesiune (MD sau TXT)

### Story 6.3 — Session grouping
**Criterii de acceptanță:**
- [ ] Grupare: Today / Yesterday / This week / Older
- [ ] Headers de grup colapsibile

---

## EPIC 7 — System Feedback & Loading States
**Prioritate:** P1 — Înaltă
**Estimare:** 2 zile

### Story 7.1 — Skeleton loaders
**Criterii de acceptanță:**
- [ ] Skeleton pentru lista de sesiuni (3 itemi)
- [ ] Skeleton pentru mesajele din sesiune
- [ ] Skeleton pentru conținutul panoului contextual

### Story 7.2 — Typing/thinking indicator
**Criterii de acceptanță:**
- [ ] Indicator animat (3 dots pulsante) când AI procesează
- [ ] Afișat ca mesaj `assistant` în thread
- [ ] Dispare când răspunsul începe să apară (streaming)

### Story 7.3 — Streaming response
**Criterii de acceptanță:**
- [ ] Textul apare progresiv (character by character sau chunk by chunk)
- [ ] Cursor animat la finalul textului în streaming
- [ ] Submit button rămâne dezactivat pe durata streaming-ului

---

## Prioritizare și ordine de execuție

| Ordinea | Epic | Motivare |
|---|---|---|
| 1 | EPIC 1 — Language Fix | Bug critic, 2 zile, impact imediat |
| 2 | EPIC 7 — System Feedback | Fundament pentru toate celelalte |
| 3 | EPIC 2 — Empty State | Prima impresie, impact pe activare |
| 4 | EPIC 3 — Input System | Core interaction loop |
| 5 | EPIC 4 — Context Panel | Discoverability funcționalități avansate |
| 6 | EPIC 5 — Navigation | Restructurare fără breaking changes |
| 7 | EPIC 6 — Session Management | Enhancement, nu blocker |

**Total estimat:** ~23 zile de development (1 developer full-time)
