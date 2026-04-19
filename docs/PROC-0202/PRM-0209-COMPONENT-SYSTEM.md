# PRM-0209 — Component System: Command Center

**Process:** PROC-0202 — command_center_ux_standard
**Output:** Componente reutilizabile, props, stări, reguli de compoziție

---

## Componente noi / modificate pentru Command Center

---

### `<CommandInput />`

**Scop:** Input bar principal — textarea + mode pills + submit + cost indicator

**Props:**
```typescript
interface CommandInputProps {
  mode: 'extract' | 'analyze' | 'generate';
  onModeChange: (mode: Mode) => void;
  onSubmit: (value: string, mode: Mode) => void;
  onAttach: () => void;
  isProcessing: boolean;
  estimatedCost?: number;
  placeholder?: string; // default: "Run a command..."
  disabled?: boolean;
}
```

**Stări:**
- `idle` — textarea goală, submit dezactivat
- `typing` — text prezent, submit activat
- `processing` — disabled, spinner în submit
- `error` — border destructive, mesaj eroare

**Reguli:**
- Auto-focus la mount pe desktop
- Nu auto-focus pe mobile (previne keyboard pop-up)
- `max-h-[180px]` cu auto-resize
- Submit pe `Enter` (fără `Shift`); newline pe `Shift+Enter`

---

### `<ModeSelector />`

**Scop:** Selector de mod (Extract / Analyze / Generate) ca pills

**Props:**
```typescript
interface ModeSelectorProps {
  value: 'extract' | 'analyze' | 'generate';
  onChange: (mode: Mode) => void;
  disabled?: boolean;
}
```

**Stări per pill:**
- `inactive` — bg-muted/40, text-muted-foreground
- `active` — bg-primary/15, text-primary, border-primary/40
- `hover` — bg-muted/60
- `disabled` — opacity 0.4, cursor not-allowed

---

### `<SessionList />`

**Scop:** Lista sesiunilor recente în empty state

**Props:**
```typescript
interface SessionListProps {
  sessions: Session[];
  maxVisible?: number; // default: 5
  onSelect: (sessionId: string) => void;
  onShowMore: () => void;
}

interface Session {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
  mode?: Mode;
}
```

**Stări:**
- `loading` — skeleton (3 itemi)
- `empty` — mesaj: `No sessions yet. Run your first command below.`
- `populated` — lista cu `maxVisible` itemi + `Show {N} more sessions`

**Reguli:**
- Grupare temporală: Today / Yesterday / This week / Older
- Titlu truncat la 60 caractere cu `...`
- Timestamp: `2h ago` / `Yesterday` / `Apr 15`

---

### `<SuggestionGrid />`

**Scop:** Grid 2×2 de sugestii contextuale în empty state

**Props:**
```typescript
interface SuggestionGridProps {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
}

interface Suggestion {
  icon: string;
  title: string;
  body: string;
  ctaLabel: string;
  command: string; // comanda care se injectează în input
}
```

**Reguli:**
- Maxim 4 sugestii
- Sugestiile sunt generate dinamic pe baza contextului utilizatorului
- Click pe card → injectează `command` în textarea + focus

---

### `<ContextPanel />`

**Scop:** Panel lateral drept cu tabs State / Runs / Assets

**Props:**
```typescript
interface ContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'state' | 'runs' | 'assets';
  onTabChange: (tab: Tab) => void;
  sessionState?: SessionState;
  runs?: Run[];
  assets?: Asset[];
}
```

**Stări:**
- `closed` — width 0, hidden
- `open` — width 320px, slide-in
- `loading` — skeleton per tab
- `empty` — mesaj specific per tab

**Reguli:**
- Auto-open când `runs.length > 0` sau `assets.length > 0`
- Badge pe tab Runs când există runs active
- Badge pe tab Assets când există assets noi

---

### `<RunCard />`

**Scop:** Card individual pentru o execuție în panoul Runs

**Props:**
```typescript
interface RunCardProps {
  run: {
    id: string;
    command: string;
    status: 'running' | 'complete' | 'failed';
    duration?: number; // ms
    cost?: number; // neurons
    output?: string;
  };
  onRetry?: () => void;
  onViewOutput?: () => void;
}
```

**Stări vizuale:**
- `running` — dot verde animat + spinner
- `complete` — checkmark verde
- `failed` — X roșu + buton Retry

---

### `<AssetCard />`

**Scop:** Card individual pentru un fișier generat în panoul Assets

**Props:**
```typescript
interface AssetCardProps {
  asset: {
    id: string;
    name: string;
    type: 'pdf' | 'txt' | 'json' | 'md' | 'csv';
    size: number; // bytes
    generatedAt: Date;
    downloadUrl: string;
  };
  onDownload: () => void;
  onPreview?: () => void;
}
```

---

### `<CommandPalette />`

**Scop:** Overlay cu lista de comenzi disponibile (trigger: `/`)

**Props:**
```typescript
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (command: Command) => void;
  query: string; // textul după `/`
}

interface Command {
  name: string; // ex: `/generate`
  description: string;
  cost?: number;
  category: 'extract' | 'analyze' | 'generate' | 'system';
}
```

**Comportament:**
- Se deschide când utilizatorul tastează `/` în textarea
- Filtrare în timp real pe `query`
- Navigare cu `↑↓`, selectare cu `Enter`, închidere cu `Escape`
- Afișează cost estimat per comandă

---

### `<ServicePicker />`

**Scop:** Overlay pentru atașarea serviciilor/fișierelor (trigger: `+`)

**Props:**
```typescript
interface ServicePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: File) => void;
  onSelectService: (service: Service) => void;
  availableServices: Service[];
}
```

**Opțiuni:**
- Upload fișier (drag & drop sau file picker)
- Servicii disponibile (Pipeline, Library, Neurons etc.)

---

### `<MessageBubble />`

**Scop:** Bulă de mesaj în thread-ul de conversație

**Props:**
```typescript
interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  cost?: number;
  onCopy?: () => void;
  isStreaming?: boolean;
}
```

**Stări:**
- `user` — aliniat dreapta, bg-primary/10
- `assistant` — aliniat stânga, bg-muted/20
- `system` — centrat, text-muted-foreground, italic
- `streaming` — cursor animat la finalul textului

---

## Reguli de compoziție

| Regulă | Detaliu |
|---|---|
| Un singur `<CommandInput />` per pagină | Nu există input duplicat |
| `<ContextPanel />` este sibling cu main canvas | Nu este nested în canvas |
| `<CommandPalette />` și `<ServicePicker />` sunt portals | Montate în `document.body`, nu în DOM-ul inputului |
| `<SuggestionGrid />` dispare când sesiune activă | Nu se afișează în thread view |
| `<SessionList />` este în empty state, nu în sidebar | Sidebar conține doar navigație, nu conținut |
