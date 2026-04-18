# PRM-0109 OUTPUT — Define Reusable Component System

**Site:** ai-idei.com
**Cluster:** CL-0101 / site_worldclass_alignment
**Process:** PROC-0201 / home_to_global_standard

---

## PRINCIPII DE SISTEM

1. **Atomic design:** Atoms → Molecules → Organisms → Templates → Pages
2. **Token-based:** Toate valorile de culoare, spacing, tipografie sunt tokens, nu valori hardcodate
3. **State-complete:** Fiecare componentă are toate stările definite (default, hover, active, disabled, loading, error, empty)
4. **Composable:** Componentele se compun, nu se duplică

---

## DESIGN TOKENS

### Color Tokens

```
--color-bg-primary: #0a0a0a (dark base)
--color-bg-secondary: #111111
--color-bg-elevated: #1a1a1a
--color-bg-overlay: rgba(0,0,0,0.7)

--color-accent-primary: #f59e0b (amber/gold — brand)
--color-accent-secondary: #d97706
--color-accent-muted: rgba(245,158,11,0.15)

--color-text-primary: #f5f5f5
--color-text-secondary: #a3a3a3
--color-text-muted: #525252
--color-text-inverse: #0a0a0a

--color-border-default: #262626
--color-border-subtle: #1c1c1c
--color-border-accent: #f59e0b

--color-status-success: #22c55e
--color-status-warning: #f59e0b
--color-status-error: #ef4444
--color-status-running: #3b82f6
--color-status-pending: #6b7280
```

### Spacing Tokens

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
--space-20: 80px
```

### Typography Tokens

```
--font-family-base: 'Inter', system-ui, sans-serif
--font-family-mono: 'JetBrains Mono', monospace

--font-size-xs: 11px
--font-size-sm: 13px
--font-size-base: 15px
--font-size-md: 17px
--font-size-lg: 20px
--font-size-xl: 24px
--font-size-2xl: 32px
--font-size-3xl: 40px
--font-size-4xl: 52px

--font-weight-regular: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700

--line-height-tight: 1.2
--line-height-base: 1.5
--line-height-relaxed: 1.7
```

---

## COMPONENTE DE BAZĂ

### 1. Button

**Variante:** primary | secondary | ghost | danger | link

**Props:**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
  size: 'sm' | 'md' | 'lg'
  label: string
  icon?: ReactNode // optional leading icon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  onClick?: () => void
  href?: string // transforms to anchor
}
```

**Stări:** default | hover | active | disabled | loading

**Specificații vizuale:**
- Primary: bg=accent-primary, text=inverse, border=none, radius=8px
- Secondary: bg=transparent, text=primary, border=1px border-default, radius=8px
- Ghost: bg=transparent, text=secondary, border=none, radius=8px
- Danger: bg=status-error, text=inverse, border=none, radius=8px
- Link: bg=none, text=accent-primary, border=none, underline on hover

---

### 2. Card

**Variante:** default | elevated | bordered | ghost | interactive

**Props:**
```typescript
interface CardProps {
  variant: 'default' | 'elevated' | 'bordered' | 'ghost' | 'interactive'
  padding?: 'sm' | 'md' | 'lg'
  header?: ReactNode
  body: ReactNode
  footer?: ReactNode
  onClick?: () => void // activates interactive variant
  selected?: boolean
  loading?: boolean
}
```

**Stări:** default | hover (interactive only) | selected | loading | empty

**Specificații vizuale:**
- Default: bg=bg-secondary, border=border-subtle, radius=12px
- Elevated: bg=bg-elevated, box-shadow=0 4px 24px rgba(0,0,0,0.4), radius=12px
- Bordered: bg=transparent, border=1px border-default, radius=12px
- Ghost: bg=bg-accent-muted, border=1px border-accent (dashed), radius=12px
- Interactive: default + cursor:pointer + hover: border-color=border-accent

---

### 3. Section Header

**Props:**
```typescript
interface SectionHeaderProps {
  label?: string // eyebrow label (e.g. "THE MECHANISM")
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  cta?: { label: string; href: string }
}
```

**Specificații vizuale:**
- Label: font-size=xs, font-weight=semibold, letter-spacing=0.1em, color=accent-primary, uppercase
- Title: font-size=2xl–3xl, font-weight=bold, color=text-primary
- Subtitle: font-size=md, font-weight=regular, color=text-secondary, max-width=600px
- CTA: link variant button, positioned right (desktop) sau sub subtitle (mobile)

---

### 4. Empty State Block

**Props:**
```typescript
interface EmptyStateProps {
  icon?: ReactNode // or illustration
  title: string
  description: string
  primaryCta: { label: string; onClick: () => void }
  secondaryCta?: { label: string; onClick: () => void }
  ghostPreview?: ReactNode // optional ghost preview component
}
```

**Stări:** default | loading (skeleton) | error

**Specificații vizuale:**
- Container: centered, max-width=480px, padding=space-12
- Icon: 48px, color=text-muted
- Title: font-size=xl, font-weight=semibold, color=text-primary
- Description: font-size=base, color=text-secondary, margin-top=space-2
- Ghost preview: opacity=0.3, pointer-events=none, margin-top=space-6

---

### 5. CTA Row

**Props:**
```typescript
interface CTARowProps {
  primary: { label: string; onClick: () => void }
  secondary?: { label: string; onClick: () => void }
  trustLine?: string
  align?: 'left' | 'center'
  sticky?: boolean // activates sticky behavior on scroll
}
```

**Specificații vizuale:**
- Primary button: size=lg, variant=primary
- Secondary: size=lg, variant=link
- Trust line: font-size=sm, color=text-muted, margin-top=space-2
- Sticky variant: position=fixed, bottom=0, width=100%, bg=bg-primary, border-top=border-subtle, z-index=100, padding=space-4 space-6

---

### 6. Progress Rail

**Props:**
```typescript
interface ProgressRailProps {
  steps: Array<{
    id: string
    label: string
    status: 'pending' | 'running' | 'complete' | 'error'
  }>
  currentStep: string
  orientation?: 'horizontal' | 'vertical'
}
```

**Specificații vizuale:**
- Step complete: color=status-success, icon=checkmark
- Step running: color=status-running, icon=spinner (animated)
- Step pending: color=text-muted, icon=circle (empty)
- Step error: color=status-error, icon=x-circle
- Connector line: bg=border-default (pending) | bg=status-success (complete)

---

### 7. Metric Tile

**Props:**
```typescript
interface MetricTileProps {
  value: string | number
  label: string
  sublabel?: string
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' }
  size?: 'sm' | 'md' | 'lg'
}
```

**Specificații vizuale:**
- Value: font-size=2xl–3xl, font-weight=bold, color=text-primary
- Label: font-size=sm, color=text-secondary, uppercase, letter-spacing=0.05em
- Trend up: color=status-success + arrow icon
- Trend down: color=status-error + arrow icon

---

### 8. Entity List

**Props:**
```typescript
interface EntityListProps {
  items: Array<{
    id: string
    title: string
    subtitle?: string
    meta?: string // e.g. date, status
    badge?: { label: string; color: string }
    actions?: Array<{ label: string; onClick: () => void }>
    onClick?: () => void
  }>
  loading?: boolean
  empty?: EmptyStateProps
  pagination?: { page: number; total: number; onPageChange: () => void }
}
```

**Specificații vizuale:**
- Item: padding=space-4, border-bottom=border-subtle, hover: bg=bg-elevated
- Title: font-size=base, font-weight=medium, color=text-primary
- Subtitle: font-size=sm, color=text-secondary
- Meta: font-size=xs, color=text-muted, align=right
- Badge: font-size=xs, padding=space-1 space-2, radius=4px

---

### 9. Context Panel

**Props:**
```typescript
interface ContextPanelProps {
  title: string
  content: ReactNode
  position?: 'right' | 'bottom'
  width?: number // desktop only
  open: boolean
  onClose: () => void
}
```

**Specificații vizuale:**
- Desktop: slide-in din dreapta, width=360–480px, bg=bg-elevated, border-left=border-default
- Mobile: slide-up din bottom, height=60vh, bg=bg-elevated, border-top=border-default
- Overlay: bg=bg-overlay, click to close
- Close button: top-right, ghost variant

---

### 10. Status Banner

**Props:**
```typescript
interface StatusBannerProps {
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  description?: string
  cta?: { label: string; onClick: () => void }
  dismissible?: boolean
}
```

**Specificații vizuale:**
- Info: bg=rgba(59,130,246,0.1), border-left=4px status-running
- Success: bg=rgba(34,197,94,0.1), border-left=4px status-success
- Warning: bg=rgba(245,158,11,0.1), border-left=4px status-warning
- Error: bg=rgba(239,68,68,0.1), border-left=4px status-error
- Dismiss: x button top-right, ghost variant, size=sm

---

## COMPOZIȚII (Organisms)

### Pipeline Status Bar (persistent)

**Compoziție:** StatusBanner (info/running) + ProgressRail (condensat, 3 pași) + Button (ghost, "View details")

**Reguli de afișare:**
- Vizibil pe toate ecranele CORE și ECONOMY când există job activ
- Dispare când nu există job activ (nu afișează empty state)
- Position: top of content area, sub header

---

### Service Card

**Compoziție:** Card (interactive) + SectionHeader (title + label) + MetricTile (cost în Neurons) + Button (primary "Run Now") + Button (secondary "Add to Pipeline")

---

### Onboarding Checklist

**Compoziție:** Card (elevated) + ProgressRail (vertical, 5 pași) + Button (primary per step)

**Pași:**
1. Upload your first source
2. Run your first service
3. Save an output to Library
4. Build your first pipeline
5. Explore the Knowledge Graph

---

## REGULI DE REUTILIZARE

1. Niciodată nu duplici o componentă — extinde prin props.
2. Orice variantă nouă vizuală se adaugă ca prop, nu ca componentă nouă.
3. Componentele nu conțin logică de business — primesc date prin props și emit events.
4. Orice componentă cu stare loading afișează skeleton, nu spinner (excepție: Button loading state).
5. Toate componentele sunt accesibile: ARIA labels, keyboard navigation, focus visible.
