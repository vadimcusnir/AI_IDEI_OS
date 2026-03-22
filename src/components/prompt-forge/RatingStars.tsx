import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface RatingStarsProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md";
}

export function RatingStars({ value, onChange, size = "sm" }: RatingStarsProps) {
  const [hover, setHover] = useState(0);
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star === value ? 0 : star)}
          className="p-0.5 rounded transition-colors hover:bg-muted"
        >
          <Star
            className={cn(
              iconSize,
              "transition-colors",
              (hover || value) >= star
                ? "fill-primary text-primary"
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}
