import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  angle: number;
  distance: number;
  scale: number;
  duration: number;
  shape: number; // index into SIGIL_SHAPES
  rotation: number;
}

/** Custom SVG sigil shapes — Obsidian Sigil DNA, no generic emojis */
const SigilParticle = ({ shape, size }: { shape: number; size: number }) => {
  const s = size;
  const color = "hsl(var(--gold-oxide))";
  const dim = "hsl(var(--gold-dim))";

  switch (shape) {
    // 4-point star burst
    case 0:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" fill={color} opacity="0.9" />
        </svg>
      );
    // Diamond shard
    case 1:
      return (
        <svg width={s} height={s} viewBox="0 0 16 24" fill="none">
          <path d="M8 0L16 10L8 24L0 10Z" fill={color} opacity="0.8" />
          <path d="M8 4L13 10L8 20L3 10Z" fill={dim} opacity="0.4" />
        </svg>
      );
    // Hexagonal mote
    case 2:
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
          <path d="M10 1L18 5.5V14.5L10 19L2 14.5V5.5L10 1Z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
        </svg>
      );
    // Tiny concentric rings (sigil eye micro)
    case 3:
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1" opacity="0.5" />
          <circle cx="8" cy="8" r="3.5" stroke={color} strokeWidth="1" opacity="0.8" />
          <circle cx="8" cy="8" r="1.5" fill={color} />
        </svg>
      );
    // Lightning fragment
    case 4:
      return (
        <svg width={s} height={s} viewBox="0 0 12 20" fill="none">
          <path d="M7 0L3 9H7L5 20L11 8H7L9 0Z" fill={color} opacity="0.85" />
        </svg>
      );
    // Cross spark
    case 5:
      return (
        <svg width={s} height={s} viewBox="0 0 20 20" fill="none">
          <line x1="10" y1="0" x2="10" y2="20" stroke={color} strokeWidth="1.5" opacity="0.7" />
          <line x1="0" y1="10" x2="20" y2="10" stroke={color} strokeWidth="1.5" opacity="0.7" />
          <circle cx="10" cy="10" r="2" fill={color} opacity="0.9" />
        </svg>
      );
    // Dot cluster (neuron micro)
    case 6:
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="4" r="1.5" fill={color} opacity="0.9" />
          <circle cx="4" cy="12" r="1.5" fill={color} opacity="0.6" />
          <circle cx="12" cy="12" r="1.5" fill={color} opacity="0.6" />
          <line x1="8" y1="4" x2="4" y2="12" stroke={color} strokeWidth="0.8" opacity="0.3" />
          <line x1="8" y1="4" x2="12" y2="12" stroke={color} strokeWidth="0.8" opacity="0.3" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" fill={color} opacity="0.8" />
        </svg>
      );
  }
};

const SHAPE_COUNT = 7;

export function MagicButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripple, setRipple] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const idRef = useRef(0);

  const explode = useCallback(() => {
    setRipple(true);
    setGlowing(true);
    setTimeout(() => setRipple(false), 700);
    setTimeout(() => setGlowing(false), 1400);

    const newParticles: Particle[] = Array.from({ length: 22 }, () => {
      idRef.current++;
      return {
        id: idRef.current,
        angle: Math.random() * 360,
        distance: 50 + Math.random() * 140,
        scale: 0.4 + Math.random() * 0.8,
        duration: 0.6 + Math.random() * 0.7,
        shape: Math.floor(Math.random() * SHAPE_COUNT),
        rotation: Math.random() * 360,
      };
    });

    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
    }, 1600);
  }, []);

  return (
    <span
      className={`relative inline-block cursor-pointer select-none ${className ?? ""}`}
      onClick={explode}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && explode()}
    >
      {/* Gold glow pulse */}
      <AnimatePresence>
        {glowing && (
          <motion.span
            className="absolute inset-0 -inset-x-6 -inset-y-3 rounded-xl bg-[hsl(var(--gold-oxide)/0.15)] blur-2xl pointer-events-none"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1.4 }}
            exit={{ opacity: 0, scale: 1.8 }}
            transition={{ duration: 1 }}
          />
        )}
      </AnimatePresence>

      {/* Hexagonal ripple */}
      <AnimatePresence>
        {ripple && (
          <motion.span
            className="absolute pointer-events-none"
            style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
            initial={{ opacity: 0.8, scale: 0.3 }}
            animate={{ opacity: 0, scale: 3.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <path
                d="M30 3L55 16.5V43.5L30 57L5 43.5V16.5L30 3Z"
                stroke="hsl(var(--gold-oxide))"
                strokeWidth="1.5"
                opacity="0.6"
              />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>

      {/* Text with micro-bounce */}
      <motion.span
        className="relative z-10 inline-block"
        whileTap={{ scale: 1.1 }}
        animate={glowing ? { scale: [1, 1.06, 1], rotate: [0, -1.5, 1.5, 0] } : {}}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.span>

      {/* Sigil particles */}
      <AnimatePresence>
        {particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * p.distance;
          const ty = Math.sin(rad) * p.distance;

          return (
            <motion.span
              key={p.id}
              className="absolute pointer-events-none z-20"
              style={{ left: "50%", top: "50%" }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.1 }}
              animate={{
                x: tx,
                y: ty,
                opacity: [1, 0.9, 0],
                scale: [0.1, p.scale, 0],
                rotate: p.rotation,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: p.duration, ease: "easeOut" }}
            >
              <SigilParticle shape={p.shape} size={Math.round(p.scale * 22)} />
            </motion.span>
          );
        })}
      </AnimatePresence>
    </span>
  );
}
