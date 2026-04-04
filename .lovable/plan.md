

## Problem

The sidebar header, footer, and top bar layout are poorly organized. Elements are cramped, the WorkspaceSwitcher takes too much vertical space with redundant labels, and the overall hierarchy doesn't match world-class SaaS patterns (Linear, Notion, Vercel).

## Reference Pattern: Linear/Notion Sidebar

```text
┌─────────────────────────┐
│ ◉ Workspace Name    ⌄   │  ← Single row: logo + workspace dropdown
│ ⌕ Search           ⌘K  │  ← Search bar
├─────────────────────────┤
│ ▸ CORE                  │
│   ● Command Center      │
│ ▸ WORK                  │
│   ○ Pipeline             │
│   ○ Library              │
│   ...                    │
│ ▸ DISCOVER              │
│   ...                    │
│ ▸ SESSIONS              │
│   ...                    │
├─────────────────────────┤
│ 🔵 user@email  🔔  ⚙️  │  ← Compact footer row
│ ████████░░ 1,240N  PRO  │  ← Credit progress bar
└─────────────────────────┘
```

## Plan

### 1. Sidebar Header — Merge Logo + Workspace into one row
- Replace the current two-element header (Logo button + WorkspaceSwitcher block) with a **single clickable row**: Logo icon + workspace name + chevron dropdown
- Remove the separate `WorkspaceSwitcher` component from the header; integrate workspace switching into the logo row dropdown
- This saves ~40px vertical space and looks like Linear's team switcher

### 2. Quick Actions — Inline search properly
- Keep Search + New Session row but make Search fill the width with the "New" button as a small icon-only button on the right
- In collapsed mode, show only the search icon and new-session icon vertically

### 3. Sidebar Footer — Reverse order, add credit bar
- **Row 1 (bottom)**: Avatar + truncated email + NotificationBell + UserMenu chevron — single compact row
- **Row 2 (above)**: Credit balance as a thin progress bar with tier badge + neuron count — clickable to /credits
- Remove the redundant Crown icon block and oversized button styling

### 4. Top Bar (AppLayout) — Minimal cleanup
- Keep: SidebarTrigger + Breadcrumbs + CompactPipeline
- Reduce height from `h-11` to `h-10` for tighter feel
- Remove `min-h-[44px] min-w-[44px]` from SidebarTrigger (those are for touch targets inside the sidebar, not the top bar)

### 5. UserMenu — Already good, minor polish
- Ensure the trigger in the footer row shows just the avatar (no duplicate email text since footer already shows it)
- Keep theme/language/settings inside the dropdown (current pattern is correct)

### Files Modified
- `src/components/AppSidebar.tsx` — Major rewrite of header + footer sections
- `src/components/AppLayout.tsx` — Top bar height tweak
- `src/components/WorkspaceSwitcher.tsx` — Simplify expanded variant to be inline (single row trigger)

