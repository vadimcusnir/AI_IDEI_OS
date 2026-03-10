# Route Tree — AI-IDEI v1.0

## Complete Route Map

```
/                           Landing page (public, standalone layout)
├── /auth                   Authentication (login/signup/forgot, standalone)
├── /reset-password         Password reset (standalone)
│
├── /u/:username            Public user profile (standalone)
├── /guest/:slug            Public guest profile (standalone)
│
│   ══════ PUBLIC + AppLayout ══════
│
├── /links                  Creator links page
├── /architecture           Architecture documentation
├── /docs                   Documentation hub
├── /docs/:section/:topic   Documentation detail
├── /changelog              Release changelog
│
│   ══════ PUBLIC KNOWLEDGE INFRASTRUCTURE ══════
│
├── /insights               Entity listing (type: insight)
├── /insights/:slug         Entity detail
├── /patterns               Entity listing (type: pattern)
├── /patterns/:slug         Entity detail
├── /formulas               Entity listing (type: formula)
├── /formulas/:slug         Entity detail
├── /contradictions         Entity listing (type: contradiction)
├── /contradictions/:slug   Entity detail
├── /applications           Entity listing (type: application)
├── /applications/:slug     Entity detail
├── /profiles               Entity listing (type: profile)
├── /profiles/:slug         Entity detail
├── /topics                 Topic listing
├── /topics/:slug           Topic detail
├── /media/profiles         Media profiles page
│
│   ══════ PROTECTED (requires auth) + AppLayout ══════
│
├── /home                   Cockpit / Dashboard
├── /neurons                Neuron listing
├── /n/new                  Neuron editor (new, fullHeight)
├── /n/:number              Neuron editor (edit, fullHeight)
├── /dashboard              Analytics dashboard
├── /extractor              Content ingestion
├── /services               Service catalog
├── /run/:serviceKey        Service execution
├── /jobs                   Job monitoring
├── /batch/:neuronId        Batch runner
├── /credits                Credits & transactions
├── /library                Artifact library
├── /library/:id            Artifact detail
├── /intelligence           Knowledge Graph & Analytics
├── /prompt-forge           Prompt engineering tool
├── /profile-extractor      Profile extraction tool
├── /profile                User profile settings
├── /notifications          Notification center
├── /feedback               Feedback submission
├── /guests                 Guest page management
├── /onboarding             Onboarding checklist
│
│   ══════ ADMIN (requires admin role) ══════
│
├── /admin                  Admin dashboard
│
│   ══════ CATCH-ALL ══════
│
└── /*                      404 Not Found
```

## Navigation Structure

### Sidebar — Pipeline Group
- Cockpit (/home)
- Extractor (/extractor)
- Neurons (/neurons)
- Services (/services)
- Jobs (/jobs)
- Library (/library)
- Guest Pages (/guests)

### Sidebar — Platform Group
- Intelligence (/intelligence)
- Credits (/credits)
- Dashboard (/dashboard)
- Onboarding (/onboarding)
- Notifications (/notifications)
- Feedback (/feedback)
- Changelog (/changelog)
- Admin (/admin) — admin only

### Sidebar — Knowledge Group
- Docs (/docs)
- Insights (/insights)
- Patterns (/patterns)
- Formulas (/formulas)
- Contradictions (/contradictions)
- Applications (/applications)
- Profiles (/profiles)
- Topics (/topics)

### Header Navigation (SiteHeader — used on some pages)
- Home, Extractor, Neurons, Services, Jobs, Credits, Feedback, Changelog

### Footer Links
- Architecture, Links, GitHub

## Route Observations

1. **Dual navigation systems**: Both `SiteHeader` (horizontal) and `AppSidebar` (vertical) exist. `AppLayout` uses `AppSidebar`; `SiteHeader` appears to be legacy/unused in current flow since `AppLayout` replaced it.
2. **Consistent layout**: All authenticated routes use `AppLayout` with sidebar.
3. **Public entity pages**: Properly accessible without auth, using AppLayout for consistent UI.
4. **Entity routing pattern**: All entity types share `EntityListing` and `EntityDetail` components, differentiated by URL path.
