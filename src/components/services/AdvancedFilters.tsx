import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export interface AdvancedFilterState {
  costMin: number;
  costMax: number;
  complexity: string[];
  outputType: string[];
  scoreTier: string[];
}

const EMPTY_FILTERS: AdvancedFilterState = {
  costMin: 0,
  costMax: 5000,
  complexity: [],
  outputType: [],
  scoreTier: [],
};

interface AdvancedFiltersProps {
  filters: AdvancedFilterState;
  onChange: (f: AdvancedFilterState) => void;
  availableComplexities: string[];
  availableOutputTypes: string[];
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-micro px-2.5 py-1 rounded-full border transition-all font-medium",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
      )}
    >
      {label}
    </button>
  );
}

export function AdvancedFilters({ filters, onChange, availableComplexities, availableOutputTypes }: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeCount = (filters.complexity.length > 0 ? 1 : 0) +
    (filters.outputType.length > 0 ? 1 : 0) +
    (filters.scoreTier.length > 0 ? 1 : 0) +
    (filters.costMin > 0 || filters.costMax < 5000 ? 1 : 0);

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  return (
    <div>
      <Button
        variant={activeCount > 0 ? "default" : "outline"}
        size="sm"
        className="h-7 text-xs gap-1.5"
        onClick={() => setOpen(!open)}
      >
        <Filter className="h-3 w-3" />
        Filters
        {activeCount > 0 && (
          <Badge variant="secondary" className="h-4 w-4 p-0 text-nano rounded-full flex items-center justify-center">
            {activeCount}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="mt-2 bg-card border border-border rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Cost range */}
          <div>
            <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Cost Range (NEURONS)
            </p>
            <Slider
              min={0}
              max={5000}
              step={50}
              value={[filters.costMin, filters.costMax]}
              onValueChange={([min, max]) => onChange({ ...filters, costMin: min, costMax: max })}
              className="mb-1"
            />
            <div className="flex justify-between text-nano text-muted-foreground font-mono">
              <span>{filters.costMin}</span>
              <span>{filters.costMax}</span>
            </div>
          </div>

          {/* Score tier */}
          <div>
            <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-2">Score Tier</p>
            <div className="flex gap-1.5">
              {["S", "A", "B", "C"].map(t => (
                <ToggleChip
                  key={t}
                  label={`Tier ${t}`}
                  active={filters.scoreTier.includes(t)}
                  onClick={() => onChange({ ...filters, scoreTier: toggleArray(filters.scoreTier, t) })}
                />
              ))}
            </div>
          </div>

          {/* Complexity */}
          <div>
            <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-2">Complexity</p>
            <div className="flex gap-1.5">
              {availableComplexities.map(c => (
                <ToggleChip
                  key={c}
                  label={c}
                  active={filters.complexity.includes(c)}
                  onClick={() => onChange({ ...filters, complexity: toggleArray(filters.complexity, c) })}
                />
              ))}
            </div>
          </div>

          {/* Output type */}
          <div>
            <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-2">Output Type</p>
            <div className="flex gap-1.5 flex-wrap">
              {availableOutputTypes.map(o => (
                <ToggleChip
                  key={o}
                  label={o}
                  active={filters.outputType.includes(o)}
                  onClick={() => onChange({ ...filters, outputType: toggleArray(filters.outputType, o) })}
                />
              ))}
            </div>
          </div>

          {/* Clear */}
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => onChange(EMPTY_FILTERS)}
            >
              <X className="h-3 w-3 mr-1" /> Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export { EMPTY_FILTERS };
