/**
 * Proprietary icon system — built on 3 primitives: incision, node, open frame.
 * Style: cut corners, partially open contours, 2 stroke widths, airy interiors, break in form.
 */

interface IconProps {
  className?: string;
  size?: number;
}

const defaults = { size: 24 };

/* Upload: container deschis + impuls descendent */
export function IconUpload({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      {/* Open container — break at top */}
      <path d="M5 20V10L8 7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M19 20V10L16 7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 20H19" stroke="currentColor" strokeWidth="1.5" />
      {/* Descending impulse — cut */}
      <path d="M12 4V14" stroke="currentColor" strokeWidth="2" />
      <path d="M9 11L12 14L15 11" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/* Podcast: undă sonoră gravată într-un disc fragmentat */
export function IconPodcast({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round">
      {/* Fragmented disc */}
      <path d="M12 2C6.48 2 2 6.48 2 12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M22 12C22 6.48 17.52 2 12 2" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <path d="M12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 12C2 17.52 6.48 22 12 22" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      {/* Engraved wave */}
      <path d="M8 12V10M10 12V8M12 12V6M14 12V8M16 12V10" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/* Assistant: nod central + 3 ramuri de execuție */
export function IconAssistant({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round">
      {/* Central node */}
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      {/* 3 execution branches — open ended */}
      <path d="M12 9V3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14.6 13.5L19 18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.4 13.5L5 18" stroke="currentColor" strokeWidth="1.5" />
      {/* Node endpoints — incomplete */}
      <circle cx="12" cy="3" r="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="19" cy="18" r="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

/* Framework: grilă ruptă și reorganizată */
export function IconFramework({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      {/* Broken grid */}
      <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" rx="1" />
      <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" rx="1" />
      <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" rx="1" />
      {/* Reorganized — open frame */}
      <path d="M14 14H21V17" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 21H21" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

/* Output: obiect compact ieșit din cadru */
export function IconOutput({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      {/* Frame — partially open */}
      <path d="M4 7V4H7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 17V20H7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 4H20V7" stroke="currentColor" strokeWidth="1.5" />
      {/* Compact object escaping */}
      <rect x="8" y="8" width="6" height="6" stroke="currentColor" strokeWidth="2" rx="1" />
      <path d="M16 16L21 21" stroke="currentColor" strokeWidth="2" />
      <path d="M21 17V21H17" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/* Extract: incision through layers */
export function IconExtract({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round">
      {/* Layers */}
      <path d="M4 8H20" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M4 16H20" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      {/* Incision */}
      <path d="M12 5V19" stroke="currentColor" strokeWidth="2" />
      <path d="M9 7L12 5L15 7" stroke="currentColor" strokeWidth="2" />
      <path d="M9 17L12 19L15 17" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/* Neuron: knowledge node with synaptic breaks */
export function IconNeuron({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      {/* Synaptic connections — broken */}
      <path d="M12 8V3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15.5 10L20 6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15.5 14L20 18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 14L4 18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 10L4 6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      {/* Open dot */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/* Multiply: single → many, bloom pattern */
export function IconMultiply({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round">
      {/* Source */}
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
      {/* Bloom lines */}
      <path d="M9 12H14" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 8L18 5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 12H19" stroke="currentColor" strokeWidth="2" />
      <path d="M14 16L18 19" stroke="currentColor" strokeWidth="1.5" />
      {/* Output nodes */}
      <circle cx="19" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="19" cy="19" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/* Control: settings surface with open indicators */
export function IconControl({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round">
      <path d="M4 7H10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 7H20" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 17H8" stroke="currentColor" strokeWidth="2" />
      <path d="M12 17H20" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" />
      {/* Break indicator */}
      <path d="M4 12H20" stroke="currentColor" strokeWidth="1" opacity="0.15" />
    </svg>
  );
}
