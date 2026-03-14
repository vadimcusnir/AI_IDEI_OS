import { Lock, Globe, Eye, Coins, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AccessIconProps {
  className?: string;
  size?: "xs" | "sm" | "md";
}

const SIZES = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
};

export function PrivateIcon({ className, size = "sm" }: AccessIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Lock className={cn(SIZES[size], "text-muted-foreground", className)} />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">Privat — vizibil doar pentru tine</TooltipContent>
    </Tooltip>
  );
}

export function PublicIcon({ className, size = "sm" }: AccessIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Globe className={cn(SIZES[size], "text-status-validated", className)} />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">Public — vizibil pentru toți</TooltipContent>
    </Tooltip>
  );
}

export function DraftIcon({ className, size = "sm" }: AccessIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Eye className={cn(SIZES[size], "text-muted-foreground/60", className)} />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">Draft — în lucru</TooltipContent>
    </Tooltip>
  );
}

export function PaidIcon({ className, size = "sm" }: AccessIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Coins className={cn(SIZES[size], "text-primary", className)} />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">Premium — necesită NEURONS</TooltipContent>
    </Tooltip>
  );
}

export function FreeIcon({ className, size = "sm" }: AccessIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Gift className={cn(SIZES[size], "text-status-validated", className)} />
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">Gratuit — acces liber</TooltipContent>
    </Tooltip>
  );
}

/** Renders the appropriate visibility icon based on status */
export function VisibilityIcon({ visibility, ...props }: AccessIconProps & { visibility: string }) {
  switch (visibility) {
    case "public":
      return <PublicIcon {...props} />;
    case "private":
      return <PrivateIcon {...props} />;
    default:
      return <DraftIcon {...props} />;
  }
}

/** Renders free/paid icon based on cost */
export function CostIcon({ cost, ...props }: AccessIconProps & { cost: number }) {
  return cost > 0 ? <PaidIcon {...props} /> : <FreeIcon {...props} />;
}
