/**
 * SectionSigil — decorative SVG divider between landing page sections.
 * Brand-specific geometric pattern. Respects reduced motion.
 */

export function SectionSigil({ className = "" }: { className?: string }) {
  return (
    <div className={`section-sigil ${className}`} aria-hidden="true">
      <svg width="120" height="24" viewBox="0 0 120 24" fill="none" className="opacity-20">
        {/* Left line */}
        <line x1="0" y1="12" x2="40" y2="12" stroke="hsl(var(--gold-oxide))" strokeWidth="0.5" />
        {/* Center diamond */}
        <path d="M54 12L60 6L66 12L60 18Z" stroke="hsl(var(--gold-oxide))" strokeWidth="0.8" fill="hsl(var(--gold-oxide))" fillOpacity="0.08" />
        {/* Inner dot */}
        <circle cx="60" cy="12" r="1.5" fill="hsl(var(--gold-oxide))" opacity="0.6" />
        {/* Right line */}
        <line x1="80" y1="12" x2="120" y2="12" stroke="hsl(var(--gold-oxide))" strokeWidth="0.5" />
        {/* Small tick marks */}
        <line x1="45" y1="10" x2="45" y2="14" stroke="hsl(var(--gold-oxide))" strokeWidth="0.5" opacity="0.4" />
        <line x1="75" y1="10" x2="75" y2="14" stroke="hsl(var(--gold-oxide))" strokeWidth="0.5" opacity="0.4" />
      </svg>
    </div>
  );
}
