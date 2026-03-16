import { Search, X, List, Grid3X3, LayoutGrid, ArrowUpDown, SortAsc, SortDesc, Filter, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ViewMode, SortField, GroupBy } from "@/hooks/useNeuronList";

const STATUS_DOTS: Record<string, string> = {
  draft: "bg-muted-foreground/40",
  active: "bg-primary",
  published: "bg-status-validated",
  archived: "bg-muted-foreground/30",
};

interface Props {
  searchQuery: string;
  searching: boolean;
  onSearch: (q: string) => void;
  onClearSearch: () => void;
  viewMode: ViewMode;
  onSetViewMode: (m: ViewMode) => void;
  sortField: SortField;
  sortDir: "asc" | "desc";
  onToggleSort: (f: SortField) => void;
  groupBy: GroupBy;
  onSetGroupBy: (g: GroupBy) => void;
  filterStatus: string | null;
  onSetFilterStatus: (s: string | null) => void;
  statuses: string[];
}

export function NeuronToolbar({
  searchQuery, searching, onSearch, onClearSearch,
  viewMode, onSetViewMode,
  sortField, sortDir, onToggleSort,
  groupBy, onSetGroupBy,
  filterStatus, onSetFilterStatus,
  statuses,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
      {/* Search */}
      <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 focus-within:border-primary/50 transition-colors">
        {searching ? (
          <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin shrink-0" />
        ) : (
          <Search className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        )}
        <input
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          placeholder="Caută neuroni..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
        />
        {searchQuery && (
          <button onClick={onClearSearch} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* View mode */}
      <div className="flex items-center gap-0.5 bg-card border border-border rounded-lg p-0.5">
        {([
          { mode: "list" as ViewMode, icon: List },
          { mode: "grid" as ViewMode, icon: Grid3X3 },
          { mode: "cards" as ViewMode, icon: LayoutGrid },
        ]).map(({ mode, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => onSetViewMode(mode)}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded transition-all",
              viewMode === mode ? "bg-primary/10 text-primary" : "text-muted-foreground/50 hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <ArrowUpDown className="h-3 w-3" /> Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {([
            { field: "updated_at" as SortField, label: "Ultima modificare" },
            { field: "created_at" as SortField, label: "Data creării" },
            { field: "title" as SortField, label: "Titlu" },
            { field: "number" as SortField, label: "Număr" },
            { field: "score" as SortField, label: "Scor" },
          ]).map(({ field, label }) => (
            <DropdownMenuItem
              key={field}
              onClick={() => onToggleSort(field)}
              className={cn(sortField === field && "text-primary")}
            >
              {label}
              {sortField === field && (
                sortDir === "desc" ? <SortDesc className="h-3 w-3 ml-auto" /> : <SortAsc className="h-3 w-3 ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Group */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Filter className="h-3 w-3" /> Grup
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          {([
            { value: "none" as GroupBy, label: "Fără grupare" },
            { value: "status" as GroupBy, label: "După status" },
            { value: "category" as GroupBy, label: "După categorie" },
            { value: "date" as GroupBy, label: "După dată" },
          ]).map(({ value, label }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => onSetGroupBy(value)}
              className={cn(groupBy === value && "text-primary")}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={filterStatus ? "default" : "outline"} size="sm" className="h-8 gap-1.5 text-xs">
            <Tag className="h-3 w-3" /> {filterStatus || "Status"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => onSetFilterStatus(null)} className={cn(!filterStatus && "text-primary")}>
            Toate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {statuses.map(s => (
            <DropdownMenuItem key={s} onClick={() => onSetFilterStatus(s)} className={cn(filterStatus === s && "text-primary")}>
              <div className={cn("h-2 w-2 rounded-full mr-2", STATUS_DOTS[s] || STATUS_DOTS.draft)} />
              {s}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
