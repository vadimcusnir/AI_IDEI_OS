# Navigation Architecture Audit Report
> Generated: 2026-03-15 | Version: 3.0

## Navigation Graph Summary

### Total Routes: 45+
- **Public**: 30 routes (landing, auth, knowledge entities, legal, community)
- **Protected**: 20 routes (pipeline, explore, manage, support)
- **Admin**: 1 route

### Navigation Surfaces
| Surface | Items | Coverage |
|---------|-------|----------|
| Sidebar | 22 items (5 sections) | Core pipeline + explore + manage |
| Footer | 18 links (5 columns) | Docs, Assets, Platform, Info, Legal |
| Mobile Bottom Bar | 4 tabs + hamburger | Essential pipeline |
| Header | Search, Language, Theme, Notifications | Global utilities |
| Breadcrumbs | Dynamic from path | Context navigation |

## Orphan Pages (No Navigation Path)

| Route | Page | Severity | Recommendation |
|-------|------|----------|----------------|
| `/architecture` | Architecture | Medium | Add to footer → Resources |
| `/prompt-forge` | Prompt Forge | High | Add to sidebar → Pipeline or user menu |
| `/profile-extractor` | Profile Extractor | Medium | Add to user menu → Activity |
| `/data-privacy` | Data Privacy | High | Add to user menu → Account |
| `/api` | API Docs | High | Add to user menu → Platform |
| `/workspace` | Workspace Settings | Critical | Add to user menu → Account |
| `/media/profiles` | Media Profiles | Medium | Add to footer → Platform |
| `/topics/discovery` | Topic Discovery | Low | Accessible from /topics page |

## Navigation Depth Analysis

| Depth | Examples | Count |
|-------|---------|-------|
| 1 | /home, /neurons, /credits | 20 |
| 2 | /n/123, /library/id, /docs/section | 10 |
| 3 | /docs/section/topic, /community/cat/thread/id | 2 |
| Max depth: 3 ✅ | | |

## Header Audit

### Current State
- Left: Sidebar trigger + Breadcrumbs
- Center: (empty flex spacer)
- Right: Search, Language, Theme, Notifications

### Issues
- ❌ No user identity controls in header
- ❌ Profile, Settings, Logout buried in sidebar footer
- ❌ No quick access to Account/Workspace/API

### Recommended Header (Right Section)
```
[Search] [Language] [Theme] [Notifications] [User Avatar Dropdown]
```

User Dropdown Structure:
- **Account**: Profile, Workspace Settings, Data Privacy, Billing (Credits)
- **Activity**: Notifications, Feedback, Prompt Forge
- **Platform**: Documentation, API & Webhooks, Architecture, Changelog
- **System**: Theme Toggle, Sign Out

## Footer Audit

### Current Issues
- ❌ `/applications` appears twice
- ❌ `/docs` appears twice in different sections
- ❌ `/changelog` appears twice
- ❌ Missing: Community, Marketplace, API, Feedback, Data Privacy
- ❌ "Info" section weak — mixes unrelated items

### Recommended Footer Structure
| Platform | Resources | Community | Legal |
|----------|-----------|-----------|-------|
| Services | Documentation | Community Forum | Terms of Service |
| Marketplace | Architecture | Feedback | Privacy Policy |
| Pipeline | Changelog | Guest Profiles | Data Privacy |
| Media Profiles | Onboarding Guide | Topics | |

## Sidebar Analysis (READ-ONLY — No Modifications)

### Current Structure (5 sections, 22 items)
1. **Pipeline** (6): Cockpit, Extractor, Neurons, Services, Jobs, Library
2. **Explore** (6): Dashboard, Intelligence, Topics, Marketplace, Community, Chat
3. **Operate** (4): Credits, Guest Pages, Pipeline, Onboarding
4. **Account** (4): Notifications, Feedback, Docs, Changelog
5. **Admin** (1): Admin Panel

### Recommendations (DO NOT IMPLEMENT — advisory only)
- **Naming**: "Operate" could be "Manage" for clarity
- **Account section**: Move Notifications/Feedback to user dropdown (they're user-scoped, not platform features)
- **Pipeline vs Operate**: "Pipeline" item in Operate conflicts with "Pipeline" section name
- **Chat**: Consider renaming to "AI Assistant" for clarity
- **Onboarding**: Could move to user menu (one-time flow, not daily access)

## Mobile Navigation Audit

### Bottom Bar (4 items + Menu)
Home, Extract, Neurons, Library, More ✅

### Issues
- ✅ Community missing from mobile menu (fixed in recent update)
- ⚠️ No quick access to Profile from bottom bar

## Click Distance Matrix

| From → To | Clicks | Standard |
|-----------|--------|----------|
| Landing → Auth | 1 | ✅ |
| Home → Any sidebar item | 1 | ✅ |
| Home → Profile | 2 (sidebar scroll) | ⚠️ → Fix with header dropdown |
| Home → Workspace Settings | 3+ | ❌ → Fix with header dropdown |
| Home → API Docs | 3+ (no link) | ❌ → Fix with header dropdown |
| Home → Data Privacy | 3+ (no link) | ❌ → Fix with header dropdown |
| Any page → Search | 1 (⌘K) | ✅ |

## Implementation Priority

### Critical (P0)
1. ✅ Header user dropdown with grouped navigation
2. ✅ Footer restructure (remove duplicates, add missing pages)
3. ✅ Fix orphan pages reachability

### High (P1)
4. Breadcrumb label coverage for all routes
5. Mobile menu community item

### Medium (P2)
6. Sidebar naming recommendations (advisory)
7. Analytics on navigation patterns
