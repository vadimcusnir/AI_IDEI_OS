

## Arhitectura actuală: Header, Footer, Sidebar

### 1. Landing Page (`/`) — complet izolată

Landing page-ul **NU** folosește `AppLayout`. Are propriul header inline (logo + ThemeToggle + Language switcher + CTA), propriul footer (`<Footer />`), și **nu are sidebar**. Este o pagină de marketing standalone.

### 2. Pagini cu `AppLayout` — toate celelalte rute

Toate rutele (publice și protejate) în afară de Landing, Auth și ResetPassword sunt învelite în `<AppLayout>`, care oferă:

- **Sidebar** (`AppSidebar`) — navigație persistentă pe stânga cu secțiuni Pipeline, Platform, Knowledge
- **Header minimal** — doar `SidebarTrigger` (hamburger) + `GlobalSearch`, fără logo, fără navigație, fără language switcher
- **Footer** — afișat doar când `fullHeight={false}` (adică pe toate paginile în afară de NeuronEditor)

### 3. `SiteHeader` — neutilizat!

Fișierul `src/components/SiteHeader.tsx` există și conține un header complet (logo, navigație, credite, language switcher, notificări, profil, logout), dar **nu este importat nicăieri**. Este cod mort.

### De ce există diferența

| Aspect | Landing (`/`) | Pagini interne (`/home`, etc.) |
|--------|--------------|-------------------------------|
| Header | Custom inline (logo, CTA, lang) | Minimal (hamburger + search) |
| Sidebar | Nu există | `AppSidebar` persistent |
| Footer | `<Footer />` direct | `<Footer />` via AppLayout |
| Language switcher | ✅ Da | ❌ Nu |
| Theme toggle | ✅ Da | ❌ Nu (doar în sidebar) |

### Concluzie

Diferența vine din faptul că Landing page-ul este o pagină de marketing separată cu propriul layout, în timp ce paginile interne folosesc un layout unificat bazat pe Sidebar. `SiteHeader.tsx` este un vestigiu care nu mai este folosit.

### Recomandare

Dacă vrei consistență, pot:
1. **Adăuga language switcher și theme toggle în header-ul AppLayout** (lângă GlobalSearch)
2. **Șterge `SiteHeader.tsx`** (cod mort)
3. **Unifica stilul** între Landing header și AppLayout header

