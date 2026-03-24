/**
 * Sigil Icons — Custom SVG icons inspired by Obsidian Sigil design language.
 * Geometric, thin-stroke, gold-oxide accent. Replaces generic lucide icons
 * in premium surfaces (ContextDrawer, badges, tier indicators).
 */

import { cn } from "@/lib/utils";

interface SigilProps {
  className?: string;
  size?: number;
}

/** Concentric rings with inner dot — represents STATE / overview */
export function SigilEye({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.9" />
      <line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
      <line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
      <line x1="1" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
      <line x1="20" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
    </svg>
  );
}

/** Lightning bolt in hexagonal frame — represents EXECUTION / runs */
export function SigilBolt({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L21 7.5V16.5L12 22L3 16.5V7.5L12 2Z" stroke="currentColor" strokeWidth="1" opacity="0.25" />
      <path d="M13.5 3.5L10 12H13L10.5 20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Layered diamond stack — represents ASSETS / outputs */
export function SigilCrystal({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L20 10L12 22L4 10L12 2Z" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      <path d="M12 6L17 10L12 18L7 10L12 6Z" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
      <path d="M4 10H20" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <path d="M12 2V6" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <path d="M12 18V22" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
}

/** Ascending spiral with nodes — represents PROGRESS / growth */
export function SigilSpiral({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 22C12 22 4 18 4 12C4 6 12 2 12 2" stroke="currentColor" strokeWidth="1" opacity="0.25" />
      <path d="M12 2C12 2 20 6 20 12C20 18 12 22 12 22" stroke="currentColor" strokeWidth="1" opacity="0.25" />
      <path d="M12 18C9 16 7 14 7 12C7 9 10 7 12 7C14 7 17 9 17 12C17 14 15 16 12 18" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
      <circle cx="12" cy="7" r="1.5" fill="currentColor" opacity="0.8" />
      <circle cx="7" cy="12" r="1" fill="currentColor" opacity="0.5" />
      <circle cx="17" cy="12" r="1" fill="currentColor" opacity="0.5" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

/** Crown with fibonacci arc — represents VIP / elite tier */
export function SigilCrown({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 17L2 8L7 12L12 4L17 12L22 8L20 17H4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4 17H20V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V17Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="4" r="1" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

/** Lock with keyhole sigil — represents LOCKED / Cusnir_OS */
export function SigilLock({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" opacity="0.7" />
      <line x1="12" y1="17.5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/** Flame with inner golden core — represents STREAK */
export function SigilFlame({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C12 2 5 9 5 14C5 18 8.5 22 12 22C15.5 22 19 18 19 14C19 9 12 2 12 2Z" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <path d="M12 10C12 10 9 13 9 15.5C9 17.5 10.5 19 12 19C13.5 19 15 17.5 15 15.5C15 13 12 10 12 10Z" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/** Neuron coin — represents CREDITS / economy */
export function SigilNeuron({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="0.8" opacity="0.15" />
      <text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="700" fontFamily="monospace" opacity="0.85">N</text>
    </svg>
  );
}

/** Checkmark in circle with radiating lines — represents COMPLETED */
export function SigilCheck({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path d="M8 12.5L11 15.5L16.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** X in circle — represents FAILED */
export function SigilFail({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** File document with gold accent line — represents DOCUMENT */
export function SigilDocument({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 3H14L19 8V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V4C5 3.44772 5.44772 3 6 3Z" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <path d="M14 3V8H19" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="8" y1="15" x2="14" y2="15" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <line x1="8" y1="18" x2="12" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.2" />
    </svg>
  );
}

/** Trending arrow — represents BURN RATE / trending */
export function SigilTrend({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 20L9 13L13 17L21 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 6H21V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );
}

/** Rocket — represents UPGRADE */
export function SigilRocket({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C12 2 8 6 8 14L4 17L5 20L8 18C8 18 10 22 12 22C14 22 16 18 16 18L19 20L20 17L16 14C16 6 12 2 12 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" opacity="0.6" />
      <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/** Clock with single hand — represents TIME */
export function SigilClock({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
      <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.6" />
      <line x1="12" y1="12" x2="12" y2="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="12" x2="16" y2="14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** Target with center dot — represents MISSIONS */
export function SigilTarget({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

/** Star with inner glow — represents RANK */
export function SigilStar({ className, size = 16 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" opacity="0.6" />
      <path d="M12 7L13.5 11H17L14 13.5L15.5 17.5L12 14.5L8.5 17.5L10 13.5L7 11H10.5L12 7Z" fill="currentColor" opacity="0.15" />
    </svg>
  );
}
