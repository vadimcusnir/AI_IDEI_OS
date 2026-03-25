import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Fallback shown while loading or on error */
  fallbackClassName?: string;
}

/**
 * Image component with native lazy loading, fade-in animation,
 * and graceful error fallback.
 */
export function OptimizedImage({
  className,
  fallbackClassName,
  alt = "",
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Handle already-cached images
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  if (error) {
    return (
      <div
        className={cn(
          "bg-muted flex items-center justify-center text-muted-foreground text-xs",
          fallbackClassName || className
        )}
        role="img"
        aria-label={alt}
      >
        {alt?.charAt(0)?.toUpperCase() || "?"}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      className={cn(
        "transition-opacity duration-300",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
      {...props}
    />
  );
}
