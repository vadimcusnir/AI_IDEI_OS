/**
 * Shared Logo component — uses lightweight static WebP by default,
 * animated GIF only when explicitly requested.
 */
import logoStatic from "@/assets/logo-static.webp";
import logoAnimated from "@/assets/logo.gif";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Use the animated GIF version (675KB). Default: static WebP (1.7KB) */
  animated?: boolean;
  /** Tailwind size class, e.g. "h-8 w-8". Default: "h-8 w-8" */
  size?: string;
  /** Additional className */
  className?: string;
  /** Alt text. Default: "AI-IDEI" */
  alt?: string;
  /** Loading strategy. Default: "lazy" */
  loading?: "lazy" | "eager";
}

export function Logo({
  animated = false,
  size = "h-8 w-8",
  className,
  alt = "AI-IDEI",
  loading = "lazy",
}: LogoProps) {
  return (
    <img
      src={animated ? logoAnimated : logoStatic}
      alt={alt}
      loading={loading}
      decoding="async"
      className={cn("object-contain", size, className)}
      width={32}
      height={32}
    />
  );
}
